// scripts/backup/lib/drive.mjs
//
// Google Drive upload for the exporter (Camada 3, BK4.2), reusing the
// Documents Ingestor's OAuth *pattern* (offline refresh token,
// drive.file scope discipline, gitignored local token file,
// interactive one-time `login`) from
// services/documents-ingestor/src/connectors/{oauth,drive}.ts —
// reimplemented over raw `fetch` instead of the `googleapis` SDK, so
// the exporter stays a zero-npm-dependency script (this repo's root has
// no package.json/node_modules by design — see the phase report for the
// full runtime-choice justification).
//
// New relative to the Ingestor (per contract SS4): a DEDICATED OAuth
// grant and root folder for backups, separate from the Ingestor's
// document folder, so a backup-bundle exposure is a distinguishable
// surface from a documents exposure.

export const DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

export function buildAuthUrl({ clientId, redirectUri }) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: DRIVE_FILE_SCOPE,
    access_type: 'offline',
    prompt: 'consent',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function tokenRequest(body, { fetchImpl = fetch } = {}) {
  const res = await fetchImpl('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body).toString(),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`google_token_request_failed_${res.status}: ${json.error || 'unknown'}: ${json.error_description || ''}`);
  }
  return json;
}

export async function exchangeCodeForTokens({ clientId, clientSecret, redirectUri, code }, io = {}) {
  return tokenRequest(
    { client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, code, grant_type: 'authorization_code' },
    io,
  );
}

export async function refreshAccessToken({ clientId, clientSecret, refreshToken }, io = {}) {
  return tokenRequest(
    { client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token' },
    io,
  );
}

async function driveApi(path, { accessToken, method = 'GET', headers = {}, body, fetchImpl = fetch }) {
  const res = await fetchImpl(`https://www.googleapis.com/drive/v3${path}`, {
    method,
    headers: { Authorization: `Bearer ${accessToken}`, ...headers },
    body,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`drive_api_failed_${res.status}: ${json.error?.message || 'unknown'}`);
  }
  return json;
}

/** Finds or creates the dedicated backup root folder (contract SS4: "a dedicated root ... not nested inside the Ingestor's root"). */
export async function ensureBackupRootFolder({ accessToken, folderName }, io = {}) {
  const fetchImpl = io.fetchImpl || fetch;
  const q = encodeURIComponent(`name='${folderName.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const found = await driveApi(`/files?q=${q}&fields=files(id,name)`, { accessToken, fetchImpl });
  if (found.files?.[0]?.id) return found.files[0].id;

  const created = await fetchImpl('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: folderName, mimeType: 'application/vnd.google-apps.folder' }),
  });
  const createdJson = await created.json();
  if (!created.ok) {
    throw new Error(`drive_folder_create_failed_${created.status}: ${createdJson.error?.message || 'unknown'}`);
  }
  return createdJson.id;
}

/** Uploads one file (multipart: metadata + media) into the given folder. Returns {fileId, webViewLink}. */
export async function uploadFileToFolder({ accessToken, folderId, filename, mimeType, data }, io = {}) {
  const fetchImpl = io.fetchImpl || fetch;
  const boundary = 'ravatex-backup-boundary-' + Date.now().toString(36);
  const metadata = JSON.stringify({ name: filename, parents: [folderId] });

  const pre = Buffer.from(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
    `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
    'utf-8',
  );
  const post = Buffer.from(`\r\n--${boundary}--`, 'utf-8');
  const body = Buffer.concat([pre, data, post]);

  const res = await fetchImpl('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`drive_upload_failed_${res.status}: ${json.error?.message || 'unknown'}`);
  }
  return { fileId: json.id, webViewLink: json.webViewLink };
}

/**
 * High-level: refresh token → ensure root folder → upload one file.
 * Returns the same shape regardless of failure point so the caller can
 * always build a backup_run_destinations row from it.
 */
export async function uploadBackupBundle({ clientId, clientSecret, refreshToken, folderName, filename, mimeType, data }, io = {}) {
  const { access_token: accessToken } = await refreshAccessToken({ clientId, clientSecret, refreshToken }, io);
  const folderId = await ensureBackupRootFolder({ accessToken, folderName }, io);
  return uploadFileToFolder({ accessToken, folderId, filename, mimeType, data }, io);
}
