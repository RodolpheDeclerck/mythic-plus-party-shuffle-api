export class CreateEventCommand {
  constructor(
    public readonly name: string,
    public readonly createdById: number
  ) {}
}
