// tslint:disable-next-line:class-name
export interface DTO_V2_ListOfSpans extends Array<DTO_V2_Span> {
}

// tslint:disable-next-line:class-name
export interface DTO_V2_Tags {
  [key: string]: string;
}

// tslint:disable-next-line:class-name
export interface DTO_V2_Endpoint {
  serviceName?: string;
  ipv4?: string;
  ipv6?: string;
  port?: number;
}

// tslint:disable-next-line:class-name
export interface DTO_V2_Annotation {
  timestamp: number;
  value: string;
}

// tslint:disable-next-line:class-name
export interface DTO_V2_Span {
  traceId: string;
  name?: string;
  parentId?: string;
  id: string;
  kind?: KindEnum;
  timestamp?: number;
  duration?: number;
  debug?: boolean;
  shared?: boolean;
  localEndpoint?: DTO_V2_Endpoint;
  remoteEndpoint?: DTO_V2_Endpoint;
  annotations?: Array<DTO_V2_Annotation>;
  tags?: DTO_V2_Tags;
}

export type KindEnum = 'CLIENT' | 'SERVER' | 'PRODUCER' | 'CONSUMER';
export const KindEnum = {
  CLIENT: 'CLIENT' as KindEnum,
  SERVER: 'SERVER' as KindEnum,
  PRODUCER: 'PRODUCER' as KindEnum,
  CONSUMER: 'CONSUMER' as KindEnum
};
