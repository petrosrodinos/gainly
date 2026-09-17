import { Injectable } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { ParsedFile, ParserStrategy } from './parser-strategy.interface';

/**
 * PDF/image ingestion is v1 scope (spec §3) — AI-assisted extraction/OCR is not wired up yet.
 * Kept as a real ParserStrategy implementation so ParserFactory stays exhaustive and adding
 * the real parser later is a one-file change.
 */
@Injectable()
export class UnsupportedParser implements ParserStrategy {
    async parse(): Promise<ParsedFile> {
        throw new BadRequestException('This file type is not supported for automatic parsing yet — PDF/image ingestion is planned for a later release. Use manual entry for now.');
    }
}
