
'use client';

import { FOOTBALL_API_KEY, FOOTBALL_API_BASE_URL } from "./constants";
import { Match, TEAM_LIST } from "./football-data";

export async function fetchFootballData(type: 'today' | 'live' | 'yesterday' | 'tomorrow'): Promise<Match[]> {
  const now = new Date();
  let date = now.toISOString().split('T')[0];
  
  if (type === 'yesterday') {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    date = d.toISOString().split('T')[0];
  } else if (type === 'tomorrow') {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    date = d.toISOString().split('T')[0];
  }
  
  const headers = {
    'x-apisports-key': FOOTBALL_API_KEY || '2f79edc60ed7f63aa4af1feea0f1ff2c',
    'x-rapidapi-host': 'v3.football.api-sports.io'
  };

  const url = type === 'live' 
    ? `${FOOTBALL_API_BASE_URL}/fixtures?live=all&timezone=Asia/Riyadh`
    : `${FOOTBALL_API_BASE_URL}/fixtures?date=${date}&timezone=Asia/Riyadh`;

  try {
    const response = await fetch(url, { method: 'GET', headers: headers, cache: 'no-store' });
    if (!response.ok) return [];
    const data = await response.json();
    if (!data.response) return [];

    return data.response.map((item: any) => ({
      id: item.fixture.id.toString(),
      homeTeamId: item.teams.home.id,
      awayTeamId: item.teams.away.id,
      homeTeam: item.teams.home.name,
      awayTeam: item.teams.away.name,
      homeLogo: item.teams.home.logo,
      awayLogo: item.teams.away.logo,
      startTime: new Date(item.fixture.date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: false }),
      status: item.fixture.status.short === 'FT' ? 'finished' : (['1H', '2H', 'HT'].includes(item.fixture.status.short) ? 'live' : 'upcoming'),
      score: { home: item.goals.home ?? 0, away: item.goals.away ?? 0 },
      minute: item.fixture.status.elapsed ?? 0,
      league: item.league.name,
      leagueId: item.league.id,
      channel: "SSC / beIN",
      commentator: "يحدد لاحقاً",
      broadcasts: [],
      date: item.fixture.date 
    }));
  } catch (error) {
    return [];
  }
}

export async function searchFootballTeams(query: string, leagueId?: string): Promise<any[]> {
  const headers = {
    'x-apisports-key': FOOTBALL_API_KEY || '2f79edc60ed7f63aa4af1feea0f1ff2c',
    'x-rapidapi-host': 'v3.football.api-sports.io'
  };

  // If a league is selected but no query, fetch ALL teams in that league
  let url = `${FOOTBALL_API_BASE_URL}/teams`;
  
  if (query.trim()) {
    url += `?search=${encodeURIComponent(query)}`;
    if (leagueId && leagueId !== 'all') url += `&league=${leagueId}`;
  } else if (leagueId && leagueId !== 'all') {
    url += `?league=${leagueId}&season=2024`; // Default to current season
  } else {
    return [];
  }

  try {
    const response = await fetch(url, { method: 'GET', headers: headers });
    if (!response.ok) return [];
    const data = await response.json();
    return data.response || [];
  } catch (error) {
    return [];
  }
}
