import { describe, expect, it } from 'vitest';

import { exportSpecification } from './export-specification';

describe('exportSpecification()', () => {
  const withIusomniaTags = `openapi: 3.0.1
info:
  description: Description
  version: 1.0.0
  title: API
servers:
  - url: https://api.iusomnia.local
paths:
  /path:
    x-kong-plugin-oidc:
      name: oidc
      enabled: true
      config:
        key_names: [api_key, apikey]
        key_in_body: false
        hide_credentials: true
    get:
      description: test
      responses:
        "200":
          description: OK`;
  it('should not remove all x-kong annotations from spec if skipAnnotations false', async () => {
    const result = await exportSpecification({ specContent: withIusomniaTags, skipAnnotations: false });
    expect(result).toBe(withIusomniaTags);
  });

  it('should remove all x-kong annotations from spec if skipAnnotations true', async () => {
    const result = await exportSpecification({ specContent: withIusomniaTags, skipAnnotations: true });
    expect(result).toBe(`openapi: 3.0.1
info:
  description: Description
  version: 1.0.0
  title: API
servers:
  - url: https://api.iusomnia.local
paths:
  /path:
    get:
      description: test
      responses:
        "200":
          description: OK
`);
  });
});
