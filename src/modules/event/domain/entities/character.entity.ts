export class Character {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly characterClass: string,
    public readonly specialization: string,
    public readonly iLevel: number,
    public readonly role: string,
    public readonly bloodLust: boolean,
    public readonly battleRez: boolean,
    public readonly keystoneMinLevel: number,
    public readonly keystoneMaxLevel: number,
    public readonly eventCode: string | null
  ) {}
}
