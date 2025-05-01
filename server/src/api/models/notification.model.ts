import { Schema, model, Types, Model } from "mongoose";

interface INotification {
  senderId: Types.ObjectId | null;
  recipientId: Types.ObjectId;
  title: string;
  message: string;
  type: "attendance" | "system" | "general" | "work" | "event";
  isRead: boolean;
  metadata?: Record<string, any>;
}

interface INotificationModel extends Model<INotification> {
  build(attrs: INotification): Promise<INotification>;
}

const notificationSchema = new Schema<INotification, INotificationModel>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["attendance", "system", "general", "work", "event"],
      default: "general",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "notifications",
  }
);

notificationSchema.statics.build = (attrs: INotification) => {
  return NotificationModel.create(attrs);
};

export const NotificationModel = model<INotification, INotificationModel>(
  "Notification",
  notificationSchema
);
