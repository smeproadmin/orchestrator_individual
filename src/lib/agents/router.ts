// ============================================================================
// Agent Router — Analyzes user intent and selects the optimal agent(s)
// This is the "intelligence" of the orchestrator — it determines which
// SME agents to spin up for each user request.
// ============================================================================

import { AGENT_REGISTRY, type AgentDefinition } from './registry';
import type { CategoryType } from '../orchestrator/types';

export interface RoutingDecision {
  primaryAgent: AgentDefinition;
  supportingAgents: AgentDefinition[];
  confidence: number;
  reasoning: string;
  detectedIntents: string[];
  entities: ExtractedEntities;
}

interface ExtractedEntities {
  locations: string[];
  prices: string[];
  organizations: string[];
  regulations: string[];
  technologies: string[];
  keywords: string[];
}

export function routeToAgents(input: string, category?: CategoryType): RoutingDecision {
  const lower = input.toLowerCase();
  const entities = extractEntities(input);

  // Score each agent based on intent trigger matches
  const scores = AGENT_REGISTRY.map(agent => {
    let score = 0;
    const matchedTriggers: string[] = [];

    for (const trigger of agent.intentTriggers) {
      if (lower.includes(trigger)) {
        score += trigger.split(' ').length; // multi-word triggers score higher
        matchedTriggers.push(trigger);
      }
    }

    // Boost based on category alignment
    if (category) {
      const categoryAgentMap: Record<string, string[]> = {
        compliance_audit: ['compliance-sme'],
        risk_analysis: ['risk-sme'],
        automation_plan: ['automation-sme'],
        for_you: [],
      };
      if (categoryAgentMap[category]?.includes(agent.id)) {
        score += 5;
      }
    }

    // Boost based on entity matches
    if (entities.locations.length > 0 && agent.id === 'real-estate-sme') score += 3;
    if (entities.prices.length > 0 && agent.id === 'real-estate-sme') score += 2;
    if (entities.prices.length > 0 && agent.id === 'financial-sme') score += 1;
    if (entities.regulations.length > 0 && agent.id === 'compliance-sme') score += 4;
    if (entities.technologies.length > 0 && agent.id === 'code-sme') score += 2;

    return { agent, score, matchedTriggers };
  });

  // Sort by score
  scores.sort((a, b) => b.score - a.score);

  // Primary agent is highest scoring (fall back to general if no matches)
  const primary = scores[0].score > 0 ? scores[0] : scores.find(s => s.agent.id === 'general-sme')!;

  // Supporting agents are any with score > 0 that aren't the primary
  const supporting = scores
    .filter(s => s.score > 0 && s.agent.id !== primary.agent.id)
    .slice(0, 2)
    .map(s => s.agent);

  const allTriggers = scores.flatMap(s => s.matchedTriggers);
  const totalMaxScore = Math.max(primary.score, 1);
  const confidence = Math.min(0.5 + (totalMaxScore / 15) * 0.5, 0.98);

  const agentNames = [primary.agent.name, ...supporting.map(a => a.name)].join(', ');
  const reasoning = primary.score > 0
    ? `Routed to ${agentNames} based on ${allTriggers.length} intent signal(s): ${[...new Set(allTriggers)].slice(0, 5).join(', ')}`
    : `No specialized intent detected. Routed to General Intelligence Agent.`;

  return {
    primaryAgent: primary.agent,
    supportingAgents: supporting,
    confidence,
    reasoning,
    detectedIntents: [...new Set(allTriggers)],
    entities,
  };
}

function extractEntities(input: string): ExtractedEntities {
  const locations: string[] = [];
  const prices: string[] = [];
  const organizations: string[] = [];
  const regulations: string[] = [];
  const technologies: string[] = [];
  const keywords: string[] = [];

  // Locations
  const zipMatch = input.match(/\b\d{5}(?:-\d{4})?\b/g);
  if (zipMatch) locations.push(...zipMatch);

  const cityPattern = /\b(katy|houston|dallas|austin|san antonio|new york|los angeles|chicago|miami|phoenix|seattle|denver|boston|atlanta|portland|nashville|charlotte|tampa|orlando|san francisco|san diego|las vegas|minneapolis|detroit|cleveland|pittsburgh|philadelphia|washington|baltimore|raleigh|jacksonville|columbus|indianapolis|milwaukee|kansas city|sacramento|san jose|fort worth|el paso|memphis|louisville|richmond|salt lake city|tucson|fresno|mesa|omaha|tulsa|arlington|new orleans|bakersfield|aurora|anaheim|honolulu|santa ana|riverside|corpus christi|lexington|stockton|st louis|saint louis|henderson|pittsburgh|anchorage|plano|laredo|newark|greensboro|chandler|norfolk|madison|glendale|scottsdale|reno|buffalo|gilbert|winston|baton rouge|lubbock|chesapeake|irving|garland|hialeah|fremont|boise|richmond|des moines)\b/gi;
  const cityMatch = input.match(cityPattern);
  if (cityMatch) locations.push(...cityMatch.map(c => c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()));

  const statePattern = new RegExp('\\b(texas|california|florida|new york|illinois|pennsylvania|ohio|georgia|north carolina|michigan|new jersey|virginia|washington|arizona|massachusetts|tennessee|indiana|maryland|missouri|wisconsin|colorado|minnesota|south carolina|alabama|louisiana|kentucky|oregon|oklahoma|connecticut|utah|iowa|nevada|arkansas|mississippi|kansas|nebraska|idaho|hawaii|maine|montana|rhode island|delaware|south dakota|north dakota|alaska|vermont|wyoming|new hampshire|west virginia|TX|CA|FL|NY|IL|PA|OH|GA|NC|MI|NJ|VA|WA|AZ|MA|TN|IN|MD|MO|WI|CO|MN|SC|AL|LA|KY|OR|OK|CT|UT)\\b', 'gi');
  const stMatch = input.match(statePattern);
  if (stMatch) locations.push(...stMatch);

  // Prices
  const priceMatch = input.match(/\$[\d,]+(?:\.\d{2})?[kKmMbB]?|\b\d{3,}[kK]\b|\b\d{1,3}(?:,\d{3})+\b/g);
  if (priceMatch) prices.push(...priceMatch);

  // Regulations
  const regMatch = input.match(/\b(GDPR|HIPAA|SOX|PCI[\s-]?DSS|CCPA|FERPA|NIST|ISO\s*27\d{3}|SOC\s*[12]|FISMA|FedRAMP|CMMC|ITAR|EAR|GLBA|FCPA)\b/gi);
  if (regMatch) regulations.push(...regMatch.map(r => r.toUpperCase()));

  // Technologies
  const techMatch = input.match(/\b(react|node\.?js|python|java|typescript|javascript|go|rust|kubernetes|docker|aws|azure|gcp|terraform|jenkins|github|gitlab|postgresql|mongodb|redis|kafka|elasticsearch|graphql|rest\s*api|microservice|serverless|lambda|cloudflare|vercel|nextjs|next\.js)\b/gi);
  if (techMatch) technologies.push(...techMatch);

  // Organizations
  const orgMatch = input.match(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+){1,3}\s(?:Inc|Corp|LLC|Ltd|Co|Group|Partners|Capital|Holdings|Technologies|Solutions|Services|Systems)\b/g);
  if (orgMatch) organizations.push(...orgMatch);

  return {
    locations: [...new Set(locations)],
    prices: [...new Set(prices)],
    organizations: [...new Set(organizations)],
    regulations: [...new Set(regulations)],
    technologies: [...new Set(technologies)],
    keywords: [...new Set(keywords)],
  };
}
