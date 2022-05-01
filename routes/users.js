const express = require("express");
const router = express.Router();
const fs = require("fs");

// Function to read JSON file
const readJson = (filePath, cb) => {
  fs.readFile(filePath, "utf-8", (err, data) => {
    if (err) {
      return cb && cb(err);
    }
    try {
      const json = JSON.parse(data);
      return cb && cb(null, json);
    } catch (err) {
      return cb && cb(err);
    }
  });
}

// Thihs is to match the date formate in the challenge details
const formatedDate = (date) => date.split(".")[0] + "Z";

// Add 1 day to date
const addDay = (date) => {
  let result = new Date(date);
  result.setDate(result.getDate() + 1);
  return formatedDate(result.toISOString());
}

// Get User
router.get("/:id/rewards", (req, res) => {
  const rewardDate = new Date(req.query.at);
  const userId = req.params.id;

  // Get days of week (Sun-Sat) based on query date param
  let week = [];

  rewardDate.setDate(rewardDate.getDate() - rewardDate.getDay());

  for (let i = 0; i < 7; i++) {
    week.push(
      formatedDate(new Date(rewardDate.setUTCHours(0, 0, 0)).toISOString())
      // new Date(rewardDate.setUTCHours(0, 0, 0)).toISOString()
    );
    rewardDate.setDate(rewardDate.getDate() + 1);
  }

  // Get user data, if user doesnt exist, create it and return rewards
  readJson("./users.json", (err, data) => {
    if (err) {
      console.log(err);
    } else {
      if (data.users[userId]) {
        res.status(200).json({
          data: data.users[userId].rewards.filter((reward) =>
            week.includes(reward.availableAt)
          ),
        });
      } else {
        // Set up new user
        const newUser = {
          [userId]: {
            rewards: [
              ...week.map((day) => ({
                availableAt: day,
                redeemedAt: null,
                expiresAt: addDay(day),
              })),
            ],
          },
        };
        // Combine new user with existing users
        const newData = {
          users: {
            ...data.users,
            ...newUser,
          },
        };
        // Write data to file
        fs.writeFile(
          "./users.json",
          JSON.stringify(newData, null, 2),
          (err) => {
            if (err) {
              console.log(err);
            } else {
              const newUserRewards = newUser[userId].rewards;
              res.status(200).json({ data: newUserRewards });
            }
          }
        );
      }
    }
  });
});

// Redeem Reward
router.patch("/:id/rewards/:rewardId/redeem", (req, res) => {
  const userId = req.params.id;
  const rewardId = req.params.rewardId;

  // Read JSON file and redeem reward
  readJson("./users.json", (err, data) => {
    if (err) {
      console.log(err);
    } else {
      // Make sure user exists
      if (data.users[userId]) {
        const userRewards = data.users[userId].rewards;
        const reward = userRewards.find(
          (reward) => reward.availableAt === rewardId
        );
        const hasNotExpired = new Date(reward.expiresAt) >= new Date();
        const isNotRedeemed = reward.redeemedAt === null;

        // If all conditions are met, redeem reward
        if (reward && hasNotExpired && isNotRedeemed) {
          reward.redeemedAt = formatedDate(new Date().toISOString());
          // Write data to file and return redeemed reward
          fs.writeFile("./users.json", JSON.stringify(data, null, 2), (err) => {
            if (err) {
              console.log(err);
            } else {
              res.status(200).json({ data: reward });
            }
          });
        } else {
          res.status(404).json({ message: "This reward is already expired" });
        }
      } else {
        res.status(404).json({ message: "User not found" });
      }
    }
  });
});

module.exports = router;
