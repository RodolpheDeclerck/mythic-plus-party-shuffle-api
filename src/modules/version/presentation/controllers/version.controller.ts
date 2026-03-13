import { Request, Response } from 'express';
import { GetVersionHandler } from '../../application/handlers/get-version.handler.js';
import { GetVersionQuery } from '../../application/queries/get-version.query.js';

export class VersionController {
  private readonly getVersionHandler: GetVersionHandler;

  constructor() {
    this.getVersionHandler = new GetVersionHandler();
  }

  getVersion = (_req: Request, res: Response): void => {
    const query = new GetVersionQuery();
    const version = this.getVersionHandler.handle(query);

    res.status(200).json(version);
  };
}
