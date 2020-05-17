export class Endpoint {
  serviceName: string;
  ipv4: string;
  port: number;

  constructor(serviceName?: string, ipv4?: string, port?: number) {
    this.setServiceName(serviceName);
    this.setIpv4(ipv4);
    this.setPort(port);
  }

  setServiceName(serviceName: string): void {
    // In zipkin, names are lowercase. This eagerly converts to alert users early.
    this.serviceName = serviceName ? serviceName.toLocaleLowerCase() : undefined;
  }

  setIpv4(ipv4: string): void {
    this.ipv4 = ipv4;
  }

  setPort(port: number): void {
    this.port = port || undefined;
  }

  isEmpty(): boolean {
    return this.serviceName === undefined
      && this.ipv4 === undefined && this.port === undefined;
  }
}
