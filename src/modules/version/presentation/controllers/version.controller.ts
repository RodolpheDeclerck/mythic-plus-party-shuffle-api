import { Request, Response } from 'express';
import { GetVersionHandler } from '../../application/handlers/get-version.handler.js';
import { GetVersionQuery } from '../../application/queries/get-version.query.js';

export class VersionController {
  private getVersionHandler = new GetVersionHandler();

  getVersion = (req: Request, res: Response): void => {
    const query = new GetVersionQuery();
    const result = this.getVersionHandler.handle(query);
    res.json(result);
  };
}
