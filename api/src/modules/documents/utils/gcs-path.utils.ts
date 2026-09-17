/**
 * GcsAdapter stores uploaded files as `${folder}/${timestamp}-${originalFilename}` and returns
 * that full path. getSignedUrl/downloadImage re-prepend a folder onto whatever `filename` they're
 * given, so callers must pass the folder and the remainder separately (not the full stored path).
 */
export function splitGcsPath(path: string): { folder: string; filename: string } {
    const separatorIndex = path.indexOf('/');
    if (separatorIndex === -1) return { folder: '', filename: path };
    return {
        folder: path.substring(0, separatorIndex),
        filename: path.substring(separatorIndex + 1),
    };
}
