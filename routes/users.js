const express = require("express");
const router = express.Router();
const fs = require("fs");

// Function to read JSON file
function readJson(filePath, cb) {
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

// Add 1 day to date
function addDay(date) {
  let result = new Date(date);
  result.setDate(result.getDate() + 1);
  return result.toISOString().split(".")[0] + "Z";
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
      new Date(rewardDate.setUTCHours(0, 0, 0)).toISOString().split(".")[0] +
        "Z"
    );
    rewardDate.setDate(rewardDate.getDate() + 1);
  }

  // Get user data, if user doesnt exist, create it and return rewards
  readJson("./users.json", (err, data) => {
    if (err) {
      console.log(err);
    } else {
      if (data.users[userId]) {
        res.json({
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
              console.log("User created");
              const newUserRewards = newUser[userId].rewards;
              res.json({ data: newUserRewards });
            }
          }
        );
      }
    }
  });
});

module.exports = router;
