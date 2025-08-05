const { default: axios } = require("axios");
const Campaign = require("../models/campaign");
const User = require("../models/users");
const { getMatrixKey, getStats } = require("../services/klaviyoService");
const asyncHandler = require("express-async-handler");
const { getValidAccessToken } = require("../services/klaviyoAuthService");

const KLAVIYO_API_KEY = process.env.KLAVIYO_API_KEY;

const fetchCampaignData = async (req, res) => {
  try {
    const campaign = await Campaign.find();
    res.status(200).json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const fetchRefinedCampaignData = async (req, res) => {
  try {
    const campaign = await Campaign.find();
    res.status(200).json({ refined_data: campaign[0].refined_data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// fetch campaign by user id
const fetchCampaignById = async (req, res) => {


  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  try {
    const campaign = await Campaign.findOne({ id: userId });
    if (!campaign) {
      console.log("Campaign not found for user:", userId);
      return res.status(404).json({ message: "Campaign not found" });
    }
    console.log("Campaign found for user:", userId);

    // return only 10 campaigns

    console.log("Returning campaign data:");
    res.status(200).json(campaign);
  } catch (err) {
    console.error("Error fetching campaign by user ID:", err.message);
    res.status(500).json({ error: err.message });
  }
};

const fetchCampaignByCampaignId = async (req, res) => {
    const { campaignId } = req.params;

  if (!campaignId) {
    return res.status(400).json({ message: "Campaign ID is required" });
  }

  try {
    
    // Search for a document where any item in raw_data array has matching id
    const campaignDoc = await Campaign.findOne({
      "raw_data.id": campaignId,
    });

    

    if (!campaignDoc) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    // Extract the matched raw_data item
    const matchedRawData = campaignDoc.raw_data.find(
      (item) => item.id === campaignId
    );

    if (!matchedRawData) {
      return res.status(404).json({ message: "Raw data campaign not found" });
    }

    return res.status(200).json(matchedRawData);
  } catch (error) {
    console.error("Error fetching campaign:", error);
    return res.status(500).json({ message: "Internal server error" });
  }

};

const saveMatrixKey = async (req, res) => {
  const userId = req.body.userId;
  const matrixKey = await getMatrixKey(userId);
  if (!userId || !matrixKey) {
    return res
      .status(400)
      .json({ message: "userId and matrixKey are required" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.set("klaviyo.matrixKey", matrixKey.id);
    await user.save();

    res.status(200).json({ message: "Matrix key saved successfully" });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

const fetchStatsKlaviyo = async (req, res) => {

  const {matrixKey, campaignId} = req.body;

  const stats = await getStats(userId, matrixKey, campaignId, year = 2025);
  if (!stats) {
    return res.status(404).json({ message: "No stats found" });
  }
  res.status(200).json(stats);
};

const refine_campaigns = async (req, res) => {

  const {userId, matrixKey} = req.body;
  if (!matrixKey) {
    return res.status(400).json({ message: "matrixKey is required" });
  }

  try {
    const campaignDocs = await Campaign.find();

    for (const doc of campaignDocs) {
      const rawCampaigns = doc.raw_data;

      for (const campaign of rawCampaigns) {
        const campaignId = campaign?.id;
        if (!campaignId){
          console.log("campaign id not found");
          continue
        } ;
        
        

        // const existing = doc.refined_data.find(r => r.campaignId === campaignId);
        // if (existing) continue; // skip already processed

        try {
          const stats = await getStats(userId, matrixKey, campaignId, year = 2025);
          if (stats) {
            doc.refined_data.push({
              campaignId,
              stats,
              refinedAt: new Date(),               
            });

            doc.no_of_refined = (doc.no_of_refined || 0) + 1;
            await doc.save();
            console.log(`✅ Refined stats added for ${campaignId}`);
          }
        } catch (statErr) {
          console.error(`⚠️ Failed to refine ${campaignId}:`, statErr.message);
        }
      }
    }

    res.status(200).json({ message: "Refinement complete" });

  } catch (err) {
    console.error("❌ Error refining campaigns:", err.message);
    res.status(500).json({ message: "Failed to refine campaigns", error: err.message });
  }
}

const fetchCampaignMessage = async (req, res) => {
    const { messageId, userId } = req.params;   
      console.log(messageId, userId);
         
    
    const accessToken = await getValidAccessToken(userId);
  try {
    
    const url = `https://a.klaviyo.com/api/campaign-messages/${messageId}`;
    const options = {
      method: "GET",
      headers: {
        accept: "application/vnd.api+json",
        revision: "2025-07-15",
       Authorization: `Bearer ${accessToken}`,
      },
    };

    fetch(url, options)
      .then((res) => res.json())
      .then((json) => {                        
        res.status(200).json(json);
      })
      .catch((err) => {
        res.status(500).json({ error: err.message });
      });
  } catch (error) {
    console.error("Error fetching stats:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const fetchMessageTemplate = async (req, res) => {
  const {templateId, userId} = req.params;
  const accessToken = await getValidAccessToken(userId);
  console.log(templateId, userId);
  
 
  try {
    const url = `https://a.klaviyo.com/api/templates/${templateId}`;
const options = {
  method: 'GET',
  headers: {
    accept: 'application/vnd.api+json',
    revision: '2025-07-15',
    Authorization: `Bearer ${accessToken}`,
  }
};

    fetch(url, options)
      .then((res) => res.json())
      .then((json) => {
        res.status(200).json(json);
      })
      .catch((err) => {
        res.status(500).json({ error: err.message });
      });
  } catch (error) {
    console.error("Error fetching message template:", error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  fetchCampaignData,
  fetchRefinedCampaignData,
  fetchCampaignById,
  fetchCampaignByCampaignId,
  saveMatrixKey,
  fetchStatsKlaviyo,
  refine_campaigns,
  fetchCampaignMessage,
  fetchMessageTemplate,
};
