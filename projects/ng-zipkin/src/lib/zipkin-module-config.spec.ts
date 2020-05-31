import {ZipkinModuleConfig} from "./zipkin-module-config";


describe('ZipkinModuleConfig', () => {
  let moduleConfig: ZipkinModuleConfig;

  beforeEach(() => {
    moduleConfig = new ZipkinModuleConfig({});
  });

  it('should create', () => {
    expect(moduleConfig).toBeTruthy();
  });
});
