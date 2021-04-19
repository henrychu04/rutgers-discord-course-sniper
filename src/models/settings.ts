import { Schema } from 'mongoose';
import * as mongoose from 'mongoose';

const SettingSchema = new Schema({
  status: Boolean,
});

export default mongoose.model('Setting', SettingSchema, 'Settings');
