/**
 * Services Index
 * 
 * Barrel exports for all services.
 */

export * as databaseService from './database.service';
export * as vesselService from './vessel.service';
export * as voyageService from './voyage.service';
export * as noonReportService from './noonReport.service';
export * as documentService from './document.service';

export const API_URL = 'http://192.168.1.55:8080';

