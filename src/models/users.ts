import { Schema } from 'mongoose';
import * as mongoose from 'mongoose';

const UserSchema = new Schema({
  d_id: String,
  webhook: String,
  courses: [Object],
});

export default mongoose.model('User', UserSchema, 'Users');
