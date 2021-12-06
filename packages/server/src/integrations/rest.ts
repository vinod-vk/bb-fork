import {
  Integration,
  DatasourceFieldTypes,
  QueryTypes,
} from "../definitions/datasource"
import { IntegrationBase } from "./base/IntegrationBase"

const BodyTypes = {
  NONE: "none",
  FORM_DATA: "form",
  ENCODED: "encoded",
  JSON: "json",
  TEXT: "text",
}

const coreFields = {
  path: {
    type: DatasourceFieldTypes.STRING,
    display: "URL",
  },
  queryString: {
    type: DatasourceFieldTypes.STRING,
  },
  headers: {
    type: DatasourceFieldTypes.OBJECT,
  },
  enabledHeaders: {
    type: DatasourceFieldTypes.OBJECT,
  },
  requestBody: {
    type: DatasourceFieldTypes.JSON,
  },
  bodyType: {
    type: DatasourceFieldTypes.STRING,
    enum: Object.values(BodyTypes),
  },
}

module RestModule {
  const fetch = require("node-fetch")
  const { formatBytes } = require("../utilities")
  const { performance } = require("perf_hooks")

  interface RestConfig {
    url: string
    defaultHeaders: {
      [key: string]: any
    }
  }

  interface Request {
    path: string
    queryString?: string
    headers?: string
    json?: any
  }

  const SCHEMA: Integration = {
    docs: "https://github.com/node-fetch/node-fetch",
    description:
      "With the REST API datasource, you can connect, query and pull data from multiple REST APIs. You can then use the retrieved data to build apps.",
    friendlyName: "REST API",
    datasource: {
      url: {
        type: DatasourceFieldTypes.STRING,
        default: "",
        required: false,
        deprecated: true,
      },
      defaultHeaders: {
        type: DatasourceFieldTypes.OBJECT,
        required: false,
        default: {},
      },
    },
    query: {
      create: {
        readable: true,
        displayName: "POST",
        type: QueryTypes.FIELDS,
        fields: coreFields,
      },
      read: {
        displayName: "GET",
        readable: true,
        type: QueryTypes.FIELDS,
        fields: coreFields,
      },
      update: {
        displayName: "PUT",
        readable: true,
        type: QueryTypes.FIELDS,
        fields: coreFields,
      },
      patch: {
        displayName: "PATCH",
        readable: true,
        type: QueryTypes.FIELDS,
        fields: coreFields,
      },
      delete: {
        displayName: "DELETE",
        type: QueryTypes.FIELDS,
        fields: coreFields,
      },
    },
  }

  class RestIntegration implements IntegrationBase {
    private config: RestConfig
    private headers: {
      [key: string]: string
    } = {}
    private startTimeMs: number = performance.now()

    constructor(config: RestConfig) {
      this.config = config
    }

    async parseResponse(response: any) {
      let data
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json()
      } else {
        data = await response.text()
      }
      const size = formatBytes(response.headers.get("content-length") || 0)
      const time = `${Math.round(performance.now() - this.startTimeMs)}ms`
      return {
        data,
        info: {
          code: response.status,
          size,
          time,
        },
      }
    }

    getUrl(path: string, queryString: string): string {
      const main = `${path}?${queryString}`
      if (!this.config.url) {
        return main
      } else {
        return `${this.config.url}/${main}`
      }
    }

    async _req({ path = "", queryString = "", headers = {}, json = {}, method = "GET" }) {
      this.headers = {
        ...this.config.defaultHeaders,
        ...headers,
      }

      const input: any = { method, headers: this.headers }
      if (json && typeof json === "object" && Object.keys(json).length > 0) {
        input.body = JSON.stringify(json)
      }

      this.startTimeMs = performance.now()
      const response = await fetch(this.getUrl(path, queryString), input)
      return await this.parseResponse(response)
    }

    async create(opts: Request) {
      return this._req({ ...opts, method: "POST" })
    }

    async read(opts: Request) {
      return this._req({ ...opts, method: "GET" })
    }

    async update(opts: Request) {
      return this._req({ ...opts, method: "PUT" })
    }

    async patch(opts: Request) {
      return this._req({ ...opts, method: "PATCH" })
    }

    async delete(opts: Request) {
      return this._req({ ...opts, method: "DELETE" })
    }
  }

  module.exports = {
    schema: SCHEMA,
    integration: RestIntegration,
  }
}
