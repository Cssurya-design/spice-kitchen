import { createClient } from "@libsql/client";

export const client = createClient({
  url: "libsql://spice-kitchen-cssurya-design.aws-ap-south-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJnaWQiOiI1ZDhlYzZmZS0zODYwLTQxYTAtOGI4NC03NmIzZjM0MGZmNDciLCJpYXQiOjE3ODkzMTE4MDYsImtpZCI6ImtHNHhtSWh2ajhLeE9BYXZyZUY0MWVyR24xUmNTbjYta2ROcFVDSkVpOUEiLCJyaWQiOiJmMTliYzdiZC0yZmMyLTRlZjAtODZiYy05YTRiNjFjYmVhYWMifQ.LXtL1ubkWvrC4RsZsh0FIbGgCU0VjuRoi_RInK59c6stiQv4qWCSrccMWUpr2qw2DZLT5vd_F5CJjHx3fzQMCQ"
});
