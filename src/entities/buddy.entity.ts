import { Optional } from "sequelize";
import { Column, CreatedAt, DataType, Model, Table, UpdatedAt } from "sequelize-typescript";

export type BuddyAttributes = {
  id: number;
  code: string;
  name: string;
  asset?: any;
  createdAt: Date;
  updatedAt: Date;
};
type BuddyCreationAttributes = Optional<BuddyAttributes, "id" | "createdAt" | "updatedAt">;
@Table({ tableName: "buddies", schema: "content" })
export class Buddy extends Model<BuddyAttributes, BuddyCreationAttributes> {
  id: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  code: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  name: string;

  @Column(DataType.JSONB)
  asset?: any;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
