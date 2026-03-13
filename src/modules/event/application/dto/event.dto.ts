export class EventDto {
  constructor(
    public readonly id: number,
    public readonly code: string,
    public readonly name: string,
    public readonly createdAt: Date,
    public readonly expiresAt: Date | null,
    public readonly updatedAt: Date,
    public readonly arePartiesVisible: boolean,
    public readonly createdById: number | null
  ) {}
}
