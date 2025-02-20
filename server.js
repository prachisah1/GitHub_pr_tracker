require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// 🔹 Fetch all PRs based on user input
app.get("/api/pulls", async (req, res) => {
    const { owner, repo } = req.query;

    if (!owner || !repo) {
        return res.status(400).json({ message: "Owner and Repository are required!" });
    }

    try {
        const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
            headers: { Authorization: `Bearer ${GITHUB_TOKEN}` },
        });

        if (response.data.length === 0) {
            return res.json({ message: "No open PRs found for this repository." });
        }

        // ✅ Return PR data with necessary details
        const pullRequests = response.data.map((pr) => ({
            id: pr.id,
            number: pr.number,
            title: pr.title,
            author: pr.user.login,  // Fix: Correct way to get author's username
            state: pr.state,
            pr_url: pr.html_url, // Public GitHub PR Link
        }));

        res.json(pullRequests);
    } catch (error) {
        console.error("Error fetching PRs:", error.message);
        res.status(500).json({ message: "Error fetching PRs", error: error.message });
    }
});

// 🔹 Fetch comments on a specific PR based on user input
app.get("/api/pulls/:prNumber/comments", async (req, res) => {
    const { owner, repo } = req.query;
    const { prNumber } = req.params;

    if (!owner || !repo) {
        return res.status(400).json({ message: "Owner and Repository are required!" });
    }

    try {
        const response = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/comments`,
            {
                headers: { Authorization: `Bearer ${GITHUB_TOKEN}` },
            }
        );

        // ✅ Return comments in a structured format
        const comments = response.data.map((comment) => ({
            id: comment.id,
            author: comment.user.login, // Fix: Correct way to get comment author's username
            body: comment.body,
            created_at: comment.created_at,
            updated_at: comment.updated_at,
            comment_url: comment.html_url, // Direct link to the comment
        }));

        res.json(comments);
    } catch (error) {
        console.error("Error fetching comments:", error.message);
        res.status(500).json({ message: "Error fetching comments", error: error.message });
    }
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
