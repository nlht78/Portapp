import { Schema, model, Model } from "mongoose";

interface IResource {
  name: string;
  slug: string;
  description: string;
}

interface IResourceModel extends Model<IResource> {
  build(attrs: IResource): Promise<IResource>;
}

const resourceSchema = new Schema<IResource, IResourceModel>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "resources",
  }
);

resourceSchema.statics.build = (attrs: IResource) => {
  return new ResourceModel(attrs);
};

export const ResourceModel = model<IResource, IResourceModel>(
  "Resource",
  resourceSchema
);
