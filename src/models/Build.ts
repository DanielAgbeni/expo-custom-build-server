import mongoose, { Schema, Document } from 'mongoose';
import type { BuildStatus, SourceType } from '../types';

export interface IBuild extends Document {
  userId: mongoose.Types.ObjectId;
  repoUrl: string;
  branch: string;
  status: BuildStatus;
  sourceType: SourceType;
  originalFilename?: string;
  logs: string;
  apkPath?: string;
  apkUrl?: string;
  apkSize?: number;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BuildSchema = new Schema<IBuild>(
  {
    userId:           { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    repoUrl:          { type: String, required: true },
    branch:           { type: String, default: 'main' },
    status:           { type: String, enum: ['queued','cloning','extracting','installing','building','success','failed'], default: 'queued' },
    sourceType:       { type: String, enum: ['repo', 'upload'], default: 'repo' },
    originalFilename: { type: String },
    logs:             { type: String, default: '' },
    apkPath:          { type: String },
    apkUrl:           { type: String },
    apkSize:          { type: Number },
    startedAt:        { type: Date },
    completedAt:      { type: Date },
  },
  { timestamps: true }
);

export const Build = mongoose.model<IBuild>('Build', BuildSchema);