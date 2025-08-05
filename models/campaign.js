const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const campaignSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
 no_of_refined: { type: Number, default : 0 }, 
  raw_data: { type: Array, default: [] },
  refined_data: { type: Array, default: [] },
}, { timestamps: true });

campaignSchema.plugin(mongoosePaginate);

module.exports = mongoose.models.Campaign || mongoose.model("Campaign", campaignSchema);
