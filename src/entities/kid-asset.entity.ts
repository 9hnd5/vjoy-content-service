import { Optional } from "sequelize";
import { Column, CreatedAt, DataType, HasMany, Model, Table, UpdatedAt } from "sequelize-typescript";
import { KidLesson } from "./kid-lesson.entity";

type KidAssetAttributes = {
  id: number;
  gem: number;
  coin: number;
  energy: number;
  currentLevelId?: number;
  currentUnitId?: number;
  buddyId?: number;
  buddyName?: string;
  learningGoal?: LearningGoal;
  lastUpdatedEnergy?: Date;
  lastBuyEnergy?: Date;
  countBuyEnergy?: number;
  createdAt: Date;
  updatedAt: Date;
};

export type LearningGoal = {
  d?: number;
  w?: number[];
};

type KidAssetCreationAttributes = Optional<KidAssetAttributes, "id" | "createdAt" | "updatedAt">;

@Table({ tableName: "kid-assets", schema: "content" })
export class KidAsset extends Model<KidAssetAttributes, KidAssetCreationAttributes> {
  id: number; //kidId

  @Column({ allowNull: false })
  gem: number;

  @Column({ allowNull: false })
  coin: number;

  @Column({ allowNull: false })
  energy: number;

  @Column
  currentLevelId?: number;

  @Column
  currentUnitId?: number;

  @Column
  buddyId?: number;

  @Column({ type: DataType.STRING(255) })
  buddyName?: string;

  @Column(DataType.JSONB)
  learningGoal?: LearningGoal;

  @Column
  lastUpdatedEnergy?: Date;

  @Column
  lastBuyEnergy?: Date;

  @Column
  countBuyEnergy?: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @HasMany(() => KidLesson)
  kidLessons: KidLesson[];
}
