export type Lead = {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  category?: string;
  categories?: string;
  city?: string;
  country?: string;
  rating?: string | number;
  reviews?: string | number;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  maps?: string;
  socials?: string | Record<string, string>;
  sent?: boolean;
  [key: string]: unknown;
};

export type Settings = {
  version: 3;
  generatorUrl: string;
  mailUrl: string;
  autoUrl: string;
  passcode: string;
};

export type MessageTemplate = {
  subject: string;
  body: string;
};

export type HistoryBatch = {
  id: string;
  query: string;
  label: string;
  ts: number;
  leads: Lead[];
};

export type SendState = 'idle' | 'loading' | 'Sent' | 'Resend';

export type ParseErrorCode =
  | 'non_json'
  | 'n8n_error'
  | 'workflow_started'
  | 'empty'
  | 'invalid_format'
  | 'proxy_error'
  | 'http_error';

export type ParseError = {
  code: ParseErrorCode;
  message: string;
  hint?: string;
  raw?: string;
};
