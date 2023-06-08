import { Optional } from "sequelize";
import { Column, CreatedAt, DataType, Default, Model, Table, UpdatedAt } from "sequelize-typescript";

export const BUDDY_STATUS = {
  NEW: 0,
  APPROVED: 1,
  PUBLISHED: 2,
  HIDE: 3,
};

export type BuddyAttributes = {
  id: string;
  name: string;
  status: number;
  asset?: any;
  type?: string;
  voice?: string
  createdAt: Date;
  updatedAt: Date;
};

type BuddyCreationAttributes = Optional<BuddyAttributes, "status" | "createdAt" | "updatedAt">;

@Table({ tableName: "buddies", schema: "content" })
export class Buddy extends Model<BuddyAttributes, BuddyCreationAttributes> {
  @Column({ primaryKey: true })
  id: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  name: string;

  @Default(BUDDY_STATUS.NEW)
  @Column({ type: DataType.INTEGER, allowNull: false })
  status: number;

  @Column(DataType.JSONB)
  asset?: any;

  @Column({ type: DataType.STRING(255) })
  type?: string;

  @Column({ type: DataType.STRING(255) })
  voice?: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
