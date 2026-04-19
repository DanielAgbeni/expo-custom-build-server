export type BuildStatus =
  | 'queued'
  | 'cloning'
  | 'extracting'
  | 'installing'
  | 'building'
  | 'success'
  | 'failed';

export type SourceType = 'repo' | 'upload';

export interface BuildJob {
  buildId: string;
  repoUrl: string;
  userId: string;
  branch: string;
  sourceType: SourceType;
  zipPath?: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
}