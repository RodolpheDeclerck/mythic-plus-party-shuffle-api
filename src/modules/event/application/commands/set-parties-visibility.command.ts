export class SetPartiesVisibilityCommand {
  constructor(
    public readonly eventCode: string,
    public readonly visible: boolean
  ) {}
}
