// tslint:disable-next-line:class-name
export interface DTO_V1_ListOfSpans extends Array<DTO_V1_Span> {
}

// tslint:disable-next-line:class-name
export interface DTO_V1_Span {
  traceId: string;
  name: string;
  parentId?: string;
  id: string;
  timestamp?: number;
  duration?: number;
  debug?: boolean;
  annotations?: Array<DTO_V1_Annotation>;
  binaryAnnotations?: Array<DTO_V1_BinaryAnnotation>;
}

// tslint:disable-next-line:class-name
export interface DTO_V1_Annotation {
  timestamp: number;
  value: string;
  endpoint?: DTO_V1_Endpoint;
}

// tslint:disable-next-line:class-name
export interface DTO_V1_Endpoint {
  serviceName: string;
  ipv4?: string;
  ipv6?: string;
  port?: number;
}

// tslint:disable-next-line:class-name
export interface DTO_V1_BinaryAnnotation {
  key: string;
  value: string;
  endpoint?: DTO_V1_Endpoint;
}
