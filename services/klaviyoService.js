require("dotenv").config();
const axios = require("axios");
const Campaign = require("../models/campaign");
const User = require("../models/users");

const KLAVIYO_API_KEY = process.env.KLAVIYO_API_KEY;

// const getCampaigns = async () => {
//   try {
//     // const response = await axios.get(
//     //   "https://a.klaviyo.com/api/campaigns/?filter=equals(messages.channel,'email')",
//     //   // "https://a.klaviyo.com/api/events/",
//     //   {
//     //     headers: {
//     //       Authorization: `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
//     //       Accept: "application/json",
//     //       revision: "2023-10-15", // Make sure this is included
//     //     },
//     //   }
//     // );
//     // return response.data;

//      let allCampaigns = [];
//   let nextUrl = `https://a.klaviyo.com/api/campaigns/?filter=equals(messages.channel,'email')`;

//   do {
//     const response = await axios.get(nextUrl,
//       {
//         headers: {
//           Authorization: `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
//           Accept: "application/json",
//           revision: "2023-10-15",
//         },
//       }
//     );
//     const { data, links } = response.data;

//     allCampaigns.push(...data);
//     nextUrl = links?.next || null;
//   } while (nextUrl);

//   return allCampaigns;

//   } catch (error) {
//     console.error("Error fetching campaigns:", error.response?.data || error.message);
//     throw error;
//   }
// };

const getCampaigns = async (userId) => {
  console.log("Fetching campaigns for user:", userId);
  if (!userId) {
    throw new Error("userId is required to fetch campaigns");
  }

  try {
    let allCampaigns = [];
    let nextUrl = `https://a.klaviyo.com/api/campaigns/?filter=equals(messages.channel,'email')`;
    let index = 0;

    do {
      console.log(`Fetching campaigns page ${index + 1}...`);
      index++;
      console.log("Current URL:", nextUrl);
      const response = await axios.get(nextUrl, {
        headers: {
          Authorization: `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
          Accept: "application/json",
          revision: "2023-10-15",
        },
      });

      const { data, links } = response.data;

      allCampaigns.push(...data);
      nextUrl = links?.next || null;
      // console.log("Next URL:", nextUrl);
    } while (nextUrl);

    // ✅ Check if a record exists for the user
    const existing = await Campaign.findOne({ id: userId });

    if (existing) {
      // ✅ Update existing
      existing.raw_data = allCampaigns;
      await existing.save();
      console.log(`✅ Updated campaign data for user: ${userId}`);
    } else {
      // ✅ Create new
      // const newCampaign = await CampaignDump.create({
      //   id: userId,
      //   raw_data: allCampaigns,
      // });

      const newCampaign = new Campaign({
        id: userId,
        raw_data: allCampaigns,
      });

      const createdBlog = await newCampaign.save();

      // console.log(`✅ Created new campaign record for user: ${userId}`, createdBlog);
    }

    return allCampaigns;
  } catch (error) {
    console.error(
      "Error fetching campaigns:",
      error.response?.data || error.message
    );
    throw error;
  }
};

const getEvents = async () => {
  try {
    const response = await axios.get("https://a.klaviyo.com/api/events/", {
      headers: {
        Authorization: `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
        Accept: "application/json",
        revision: "2023-10-15", // Make sure this is included
      },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching events:",
      error.response?.data || error.message
    );
    throw error;
  }
};

const getProfiles = async () => {
  try {
    const response = await axios.get("https://a.klaviyo.com/api/profiles/", {
      headers: {
        Authorization: `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
        Accept: "application/json",
        revision: "2023-10-15",
      },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching profiles:",
      error.response?.data || error.message
    );
    throw error;
  }
};

const getList = async () => {
  try {
    const response = await axios.get("https://a.klaviyo.com/api/lists/", {
      headers: {
        Authorization: `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
        Accept: "application/json",
        revision: "2023-10-15",
      },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching lists:",
      error.response?.data || error.message
    );
    throw error;
  }
};

const getFlows = async () => {
  try {
    const response = await axios.get("https://a.klaviyo.com/api/flows/", {
      headers: {
        Authorization: `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
        Accept: "application/json",
        revision: "2023-10-15",
      },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching flows:",
      error.response?.data || error.message
    );
    throw error;
  }
};

const getMetrics = async () => {
  try {
    const response = await axios.get("https://a.klaviyo.com/api/metrics/", {
      headers: {
        Authorization: `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
        Accept: "application/json",
        revision: "2023-10-15",
      },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching metrics:",
      error.response?.data || error.message
    );
    throw error;
  }
};

const getMatrixKey = async () => {
  try {
    const response = await axios.get("https://a.klaviyo.com/api/metrics/", {
      headers: {
        Authorization: `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
        Accept: "application/json",
        revision: "2023-10-15",
      },
    });

    // find matrix with name "Placed Order"
    const metrics = response.data.data;
    const placedOrderMetric = metrics.find(
      (metric) => metric.attributes.name === "Placed Order"
    );
    if (placedOrderMetric) {
      return placedOrderMetric;
    } else {
      throw new Error("Placed Order metric not found");
    }
  } catch (error) {
    console.error(
      "Error fetching metrics:",
      error.response?.data || error.message
    );
    throw error;
  }
};

const getCatalogs = async () => {
  try {
    const response = await axios.get(
      "https://a.klaviyo.com/api/catalog-items/",
      {
        headers: {
          Authorization: `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
          Accept: "application/json",
          revision: "2023-10-15",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching catalogs:",
      error.response?.data || error.message
    );
    throw error;
  }
};

const getStats = async (matrixKey, campaignId, year ) => {
  try {
    const url = "https://a.klaviyo.com/api/campaign-values-reports";
    const options = {
      method: "POST",
      headers: {
        accept: "application/vnd.api+json",
        revision: "2025-07-15",
        "content-type": "application/vnd.api+json",
        Authorization: `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
      },
      body: JSON.stringify({
        data: {
          type: "campaign-values-report",
          attributes: {
            statistics: [
              "average_order_value",
              "bounce_rate",
              "bounced",
              "bounced_or_failed",
              "bounced_or_failed_rate",
              "click_rate",
              "click_to_open_rate",
              "clicks",
              "clicks_unique",
              "conversion_rate",
              "conversion_uniques",
              "conversion_value",
              "conversions",
              "delivered",
              "delivery_rate",
              "failed",
              "failed_rate",
              "open_rate",
              "opens",
              "opens_unique",
              "recipients",
              "revenue_per_recipient",
              "spam_complaint_rate",
              "spam_complaints",
              "unsubscribe_rate",
              "unsubscribe_uniques",
              "unsubscribes",
            ],
            timeframe: {
              start: `${year}-01-01T00:00:00+00:00`,
              end: `${year}-12-31T00:00:00+00:00`,
            },
            conversion_metric_id: matrixKey,
            filter: `and(equals(campaign_id,"${campaignId}"))`,
          },
        },
      }),
    };    
    
    // console.log("--------------------");

    //  console.log("⏳ Fetching stats for year:", year);

    const response = await fetch(url, options); 
    const json = await response.json();         
    
    if (!json?.data || json.data.length === 0) {
      if (year > 2022) {
        console.log(`No data for ${year}, trying ${year - 1}`);
        return await getStats(matrixKey, campaignId, year - 1);
      } else {
        return "No data in recent years";
      }
    }

    return json;
//       data: {
//         type: "campaign-values-report",
//         attributes: {
//           statistics: [
//             "average_order_value", "bounce_rate", "bounced", "bounced_or_failed",
//             "bounced_or_failed_rate", "click_rate", "click_to_open_rate", "clicks",
//             "clicks_unique", "conversion_rate", "conversion_uniques", "conversion_value",
//             "conversions", "delivered", "delivery_rate", "failed", "failed_rate",
//             "open_rate", "opens", "opens_unique", "recipients", "revenue_per_recipient",
//             "spam_complaint_rate", "spam_complaints", "unsubscribe_rate",
//             "unsubscribe_uniques", "unsubscribes"
//           ],
//           timeframe: {
//             start: `${year}-01-01T00:00:00+00:00`,
//             end: `${year}-12-31T00:00:00+00:00`,
//           },
//           conversion_metric_id: matrixKey,
//           filter: `and(equals(campaign_id,"${campaignId}"))`,
//         },
//       },
//     };


// const response = await axios.post(url, payload, {
//       headers: {
//         accept: "application/vnd.api+json",
//         revision: "2025-07-15",
//         "content-type": "application/vnd.api+json",
//         Authorization: `Klaviyo-API-Key ${process.env.KLAVIYO_API_KEY}`,
//       },
//     });

//     const json = response.data;
//     console.log(json);
    

//     if (!json?.data || json.data.length === 0) {
//       console.log(`No data found for ${year}, trying previous year...`);
//       return getStats(matrixKey, campaignId, year - 1); // recursion
//     }

//     return json; 

  } catch (error) {
    console.error("Error fetching stats:", error.message);
    throw error;
  }
};

module.exports = {
  getCampaigns,
  getProfiles,
  getEvents,
  getList,
  getFlows,
  getMetrics,
  getMatrixKey,
  getCatalogs,
  getStats,
};
