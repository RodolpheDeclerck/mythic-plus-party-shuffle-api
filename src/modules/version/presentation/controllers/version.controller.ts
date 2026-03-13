import { Request, Response } from 'express';
import { GetVersionHandler } from '../../application/handlers/get-version.handler.js';
import { GetVersionQuery } from '../../application/queries/get-version.query.js';

export class VersionController {
  private readonly getVersionHandler: GetVersionHandler;

  constructor() {
    this.getVersionHandler = new GetVersionHandler();
  }

  async getVersion(req: Request, res: Response): Promise<void> {
    const query = new GetVersionQuery();
    const result = await this.getVersionHandler.execute(query);
    res.json(result);
  }
}
