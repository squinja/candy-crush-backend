const axios = require("axios");
const express = require("express");
const cors = require("cors");

const app = express();
require("dotenv").config();

const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

const url = process.env.URL;

app.get("/", (req, res) => {
  res.json("this works");
});

app.get("/scores", (req, res) => {
  const options = {
    method: "GET",
    headers: {
      Accepts: "application/json",
      "X-Cassandra-Token": process.env.ASTRA_TOKEN,
    },
  };
  axios(`${url}?page-size=20`, options)
    .then((response) => res.status(200).json(response.data))
    .catch((err) => res.status(500).json({ message: err }));
});

app.post("/addscore", (req, res) => {
  const bodyContent = req.body;

  const options = {
    method: "POST",
    headers: {
      Accepts: "application/json",
      "X-Cassandra-Token": process.env.ASTRA_TOKEN,
    },
    data: bodyContent,
  };
  axios(url, options)
    .then((response) => res.status(200).json(response.data))
    .catch((err) => res.status(500).json({ message: err }));
});

app.post("/users", async (req, res) => {
  try {
    const username = req.body.username;

    if (!username.match(/^[a-zA-Z]+$/)) {
      res.status(400).send("Invalid username. Only use letter characters.");
      return;
    }

    const response = await axios.get(
      `${process.env.BASE_URL}users/${username}`,
      {
        headers: {
          Accepts: "application/json",
          "X-Cassandra-Token": process.env.ASTRA_TOKEN,
        },
      }
    );
    const data = response.data;

    //
    if (data.count > 0) {
      res.status(200).send({
        msg: "Successfully signed in.",
        success: true,
        data: data.data[0],
      });
      return;
    }

    // TODO create the user in the table

    const createResponse = await axios.post(
      `${process.env.BASE_URL}users`,
      {
        userName: username,
        highscore: 0,
      },
      {
        headers: {
          Accepts: "application/json",
          "X-Cassandra-Token": process.env.ASTRA_TOKEN,
        },
      }
    );

    res.status(200).send({
      msg: "Successfully created username.",
      success: true,
      data: createResponse.data,
    });
  } catch (error) {
    console.log(error.response);
    res.status(500).send("Something went wrong");
  }
});

app.delete("/users/:username", async (req, res) => {
  try {
    await axios.delete(`${process.env.BASE_URL}users/${req.params.username}`, {
      headers: {
        Accepts: "application/json",
        "X-Cassandra-Token": process.env.ASTRA_TOKEN,
      },
    });
    console.log(req.params.username);
    res.status(200).send("user deleted");
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

app.patch("/users/:username", async (req, res) => {
  const highscore = req.body.highscore;
  const username = req.params.username;
  try {
    // UPDATE HIGHSCORE OF USER
    const response = await axios.patch(
      `${process.env.BASE_URL}users/${username}`,
      {
        highscore,
      },
      {
        headers: {
          Accepts: "application/json",
          "X-Cassandra-Token": process.env.ASTRA_TOKEN,
        },
      }
    );

    res.status(200).send(response.data);
  } catch (error) {
    console.log(error.response);
    res.status(500).send(error);
  }
});

app.get("/users", async (req, res) => {
  try {
    const { data } = await axios.get(`${process.env.BASE_URL}users/rows`, {
      headers: {
        Accepts: "application/json",
        "X-Cassandra-Token": process.env.ASTRA_TOKEN,
      },
    });

    res.status(200).send({
      msg: "Retrieved users.",
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

app.listen(PORT, () => console.log(`server running on PORT ${PORT}`));

// {
//     "name": "users",
//     "columnDefinitions": [
//       {
//         "name": "userName",
//         "typeDefinition: "text"
//       },
//       {
//         "name": "highscore",
//         "typeDefinition": "integer"
//       }
//     ],
//     "primaryKey": {
//       "partitionKey": ["userName"]
//     }
//   }
