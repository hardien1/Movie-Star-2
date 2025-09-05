

import { GoogleGenAI, Type } from "@google/genai";

declare var Chart: any; // Inform TypeScript about the global Chart object

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- CONSTANTS ---
const STORAGE_KEY = 'hollywoodAscentSave';
const BASE_EXPENSES = 50;
const GENDERS = ['Male', 'Female', 'Non-binary'];
const BIRTHPLACES = [
  "Los Angeles, USA",
  "New York City, USA",
  "Chicago, USA",
  "London, UK",
  "Manchester, UK",
  "Edinburgh, UK",
];

const HAIR_COLORS = ['#1A1A1D', '#4A312A', '#B8860B', '#F0E68C', '#A52A2A', '#D2B48C', '#696969'];
const SKIN_TONES = ['#F9E4D4', '#E0C8B6', '#D1A377', '#A17A5A', '#6B4A3A', '#3C2E28'];
const CLOTHING_COLORS = ['#03DAC6', '#CF6679', '#BB86FC', '#FFD700', '#F5F5F7', '#1A1A1D'];


// --- DOM ELEMENTS ---
const statsHeader = document.getElementById('stats-header') as HTMLElement;
const advanceWeekBtn = document.getElementById('advance-week-btn') as HTMLButtonElement;
const navButtons = document.querySelectorAll<HTMLButtonElement>('#bottom-nav button');
const views = document.querySelectorAll<HTMLElement>('.view');

// Modal Elements
const modalBackdrop = document.getElementById('modal-backdrop') as HTMLElement;
const modalIcon = document.getElementById('modal-icon') as HTMLElement;
const modalTitle = document.getElementById('modal-title') as HTMLElement;
const modalText = document.getElementById('modal-text') as HTMLElement;
const modalChoices = document.getElementById('modal-choices') as HTMLElement;
const feedbackContainer = document.getElementById('feedback-container') as HTMLElement;


// Chart instances
let playerStatsChart: any;
let wealthChart: any;

// --- VIEW STATE ---
let activeCareerView: 'main' | 'auditions' | 'onSet' = 'main';
let selectedRoleForView: number | null = null;
let activeDashboardTab: 'feed' | 'schedule' = 'feed';
let hstarDbViewState = {
    view: 'main' as 'main' | 'actor' | 'project',
    selectedId: null as string | null,
};
let wealthViewState: 'overview' | 'shop' | 'assets' = 'overview';
let activeShopCategory: 'Real Estate' | 'Vehicles' | 'Luxury Goods' = 'Real Estate';
let activeSocialView: 'feed' | 'dms' | 'chat' = 'feed';
let selectedConversationId: string | null = null;
let activeRelationshipView: 'colleagues' | 'dating' = 'colleagues';


// --- TYPES ---
type PersonalityTrait = 'Friendly' | 'Ambitious' | 'Diva' | 'Method Actor' | 'Professional' | 'Insecure' | 'Jokester';

interface NPC {
    id: string;
    name: string;
    profession: 'Actor' | 'Director';
    personality: PersonalityTrait;
    fame: number; // 0-100
    actingSkill: number; // 0-100, for actors
    currentProjectWeeksLeft: number;
}

interface PlayerRelationship {
    npcId: string;
    relationshipScore: number; // -100 to 100
    status: 'Acquaintance' | 'Friend' | 'Rival';
    memory: string[]; // Short summaries of recent key interactions
}

interface DatingProfile {
    id: string;
    name: string;
    age: number;
    gender: 'Male' | 'Female' | 'Non-binary';
    profession: string;
    bio: string;
    portrait: string; // Emoji
}

interface RomanticPartner extends DatingProfile {
    relationshipScore: number; // 0-100
    weeksTogether: number;
    weeklyActionsTaken: number;
}

interface Agent {
    name: string;
    relationshipScore: number;
    commission: number; // e.g., 0.10 for 10%
}

interface Asset {
    id: string;
    name: string;
    category: string;
    purchasePrice: number;
    weeklyUpkeep: number;
}

interface ShopItem {
    id: string;
    name: string;
    category: 'Real Estate' | 'Vehicles' | 'Luxury Goods';
    icon: string;
    price: number;
    weeklyUpkeep: number;
    happinessBoost: number;
    reputationBoost: number;
}

interface Background {
    id: string;
    name: string;
    icon: string;
    description: string;
    apply: (state: typeof gameState) => void;
}

type BudgetCategory = 'Indie' | 'Mid-Budget' | 'Blockbuster';

interface Audition {
    id: string;
    title: string;
    projectType: 'Film' | 'TV Show' | 'Theater' | 'Commercial';
    role: 'Lead' | 'Supporting' | 'Minor' | 'Extra';
    director: string; // Director's name
    directorId: string; // Director's NPC ID
    genre: 'Action' | 'Comedy' | 'Drama' | 'Romance' | 'Horror' | 'Sci-Fi';
    weeklyPay: number;
    famePotential: 'Low' | 'Medium' | 'High';
    difficulty: number; // A number from 1-100 to represent required skill
    weeks: number;
    description: string;
    budgetCategory: BudgetCategory;
    backendPoints: number; // e.g., 0.05 for 5%
}

interface CurrentRole {
    title: string;
    characterName: string;
    roleType: 'Lead' | 'Supporting' | 'Minor' | 'Extra';
    projectType: 'Film' | 'TV Show' | 'Theater' | 'Commercial';
    genre: 'Action' | 'Comedy' | 'Drama' | 'Romance' | 'Horror' | 'Sci-Fi';
    weeklyPay: number;
    weeksLeft: number;
    initialWeeks: number;
    projectPopularity: number; // 0-100
    performanceScore: number; // 0-100
    castAndCrew: string[]; // Array of NPC IDs
    weeklyActionsTaken: number;
    backendPoints: number; // e.g., 0.05 for 5%
    budgetCategory: BudgetCategory;
}

interface CompletedRole {
    title: string;
    characterName: string;
    year: number;
    weekCompleted: number;
    fameGained: number;
    reputationGained: number;
    genre: 'Action' | 'Comedy' | 'Drama' | 'Romance' | 'Horror' | 'Sci-Fi';
    director: string;
    cast: string[]; // Array of NPC IDs
    boxOfficeGross: number;
    playerCut: number;
    boxOfficeResult: string;
    finalPerformanceScore: number;
    roleType: 'Lead' | 'Supporting' | 'Minor' | 'Extra';
}

interface AwardLog {
    year: number;
    award: string;
    project: string;
    won: boolean;
}

interface Activity {
    id: string;
    name: string;
    category: 'Personal' | 'Career' | 'Social' | 'Mischief';
    description: string;
    cost: number;
    icon: string;
    effects: {
        health?: number;
        happiness?: number;
        fame?: number;
        reputation?: number;
        actingSkill?: number;
        cash?: number;
    };
    logMessage: string;
}

type HgramPostCategory = 'BehindTheScenes' | 'RedCarpet' | 'Vacation' | 'Training' | 'Personal' | 'Promo';
const HGRAM_POST_CATEGORIES: { id: HgramPostCategory, name: string, icon: string }[] = [
    { id: 'Promo', name: 'Promote Project', icon: '📣' },
    { id: 'BehindTheScenes', name: 'Behind The Scenes', icon: '🎬' },
    { id: 'Vacation', name: 'Luxury Vacation', icon: '✈️' },
    { id: 'Personal', name: 'Personal Life', icon: '❤️' },
    { id: 'Training', name: 'Training Montage', icon: '💪' },
    { id: 'RedCarpet', name: 'Red Carpet Look', icon: '✨' },
];

interface Post {
    id: string;
    week: number;
    age: number;
    author: string; // Player name, NPC name, Brand name
    authorHandle: string;
    authorPFP: string; // Emoji
    type: 'Player' | 'NPC' | 'Brand' | 'News';
    category: HgramPostCategory;
    imageDescription: string;
    caption: string;
    likes: number;
    comments: number;
    shares: number;
    isViral?: boolean;
}

interface DirectMessage {
    senderId: 'player' | string; // 'player' or NPC ID
    week: number;
    text: string;
}

interface DmConversation {
    npcId: string;
    messages: DirectMessage[];
    isRead: boolean;
}

interface CalendarEvent {
    day: number; // 0-6 for Mon-Sun
    title: string;
    icon: string;
    type: 'Work' | 'Finance' | 'Personal' | 'AWARD_CEREMONY';
}

interface HStarDBActor {
    id: string;
    name: string;
    isPlayer: boolean;
    age: number;
    nationality: string;
    popularityRating: number; // 0-100 Star Meter
    filmography: string[]; // array of project IDs
    awards: { year: number; award: string; project: string; won: boolean }[];
    achievements: { year: number; text: string }[];
}

interface HStarDBProject {
    id: string;
    title: string;
    year: number;
    genre: string;
    director: string;
    cast: { actorId: string, characterName: string }[];
    boxOffice: string; // e.g., "Blockbuster Hit", "Moderate Success", "Box Office Bomb"
    budget: number;
    worldwideGross: number;
    rating: number; // Critic rating 0-10
    audienceRating: number; // Audience rating 0-10
    reviews: string[]; // AI-generated fan reviews
    budgetCategory: string; // e.g., 'Indie', 'Mid-Budget', 'Blockbuster'
    audienceReception: string; // e.g., 'Critically Acclaimed', 'Cult Classic'
}

interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    condition: (state: typeof gameState) => boolean;
}

// --- AVATAR FUNCTIONS ---
const HAIRSTYLES = [
    { name: 'Middy', path: "M25,55 C20,40 35,25 50,25 C65,25 80,40 75,55 L72,60 L28,60 Z" },
    { name: 'Spiky', path: "M50,22 L40,35 L30,30 L35,40 L25,45 L40,48 L50,52 L60,48 L75,45 L65,40 L70,30 L60,35 Z" },
    { name: 'Bun', path: "M30,40 C25,35 30,26 50,26 C70,26 75,35 70,40 L68,50 L32,50 Z M50,18 A5,5 0 0,1 50,28 A5,5 0 0,1 50,18 Z" },
    { name: 'Long', path: "M25,45 C15,55 15,75 28,85 L35,55 L65,55 L72,85 C85,75 85,55 75,45 L50,25 Z" },
    { name: 'Bald', path: "M0,0" },
];

/**
 * Generates a detailed SVG for the player's avatar based on their appearance settings.
 * @param appearance - The player's appearance object.
 * @returns An SVG string.
 */
function generateAvatarSVG(appearance: { hairColor: string; skinTone: string; clothingColor: string; hairstylePath: string; }): string {
    return `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-label="Player avatar">
        <rect x="0" y="0" width="100" height="100" fill="#2C2C31"/>
        <g id="avatar-body">
            <!-- Clothing -->
            <path d="M 50,70 C 40,65 30,70 20,80 L 80,80 C 70,70 60,65 50,70 L 50,95 L 85,95 L 80,80 L 20,80 L 15,95 L 50,95 Z" fill="${appearance.clothingColor}" />
            <!-- Neck -->
            <rect x="45" y="62" width="10" height="10" fill="${appearance.skinTone}"/>
            <!-- Head -->
            <path d="M50,28 C35,28 25,38 25,55 C25,65 35,72 50,72 C65,72 75,65 75,55 C75,38 65,28 50,28 Z" fill="${appearance.skinTone}"/>
        </g>
        <!-- Hair -->
        <path id="avatar-hair" d="${appearance.hairstylePath}" fill="${appearance.hairColor}"/>
        <!-- Eyes -->
        <g id="avatar-eyes" fill="#101012">
          <circle cx="42" cy="52" r="2" />
          <circle cx="58" cy="52" r="2" />
        </g>
    </svg>
    `;
}
const initialGameState = {
    age: 18,
    week: 1,
    isGameOver: false,
    stats: {
        health: 100,
        happiness: 70,
        actingSkill: 10,
        fame: 5,
        reputation: 50,
        popularityRating: 10, // For HStarDB
        history: {
            week: [] as number[],
            fame: [] as number[],
            actingSkill: [] as number[],
            happiness: [] as number[],
            health: [] as number[],
            reputation: [] as number[],
        }
    },
    wealth: {
        cash: 2000,
        income: 0,
        expenses: BASE_EXPENSES, // Basic living costs
        assets: [] as Asset[],
        history: {
            week: [] as number[],
            cash: [] as number[],
        }
    },
    career: {
        currentRoles: [] as CurrentRole[],
        agent: null as Agent | null,
        auditionBoost: 0, // A percentage boost for the next audition
        auditionGenreRequest: null as string | null,
        completedRoles: [] as CompletedRole[],
        awards: [] as AwardLog[],
        availableAuditions: [] as Audition[],
        appliedAuditions: [] as string[],
    },
    social: {
        status: 'Single',
        partner: null as RomanticPartner | null,
        datingPool: [] as DatingProfile[],
        relationships: [] as PlayerRelationship[],
        feed: [] as Post[],
        followers: 1500,
        handle: 'new_star',
        dms: [] as DmConversation[],
        hasUnreadDms: false,
    },
    schedule: [] as CalendarEvent[],
    hstarDb: {
        actors: [] as HStarDBActor[],
        projects: [] as HStarDBProject[],
    },
    npcs: [] as NPC[],
    activities: {},
    player: {
        name: 'Player',
        gender: 'Non-binary',
        birthplace: 'Los Angeles, USA',
        hairstyle: HAIRSTYLES[0].name,
        background: '',
        achievements: [] as string[],
        datingPreference: 'Everyone' as 'Male' | 'Female' | 'Everyone',
        appearance: {
            hairColor: '#4A312A',
            skinTone: '#D1A377',
            clothingColor: '#03DAC6',
            hairstylePath: HAIRSTYLES[0].path,
        }
    },
    log: [] as string[],
    scheduledEvents: [] as { weeksLeft: number; type: string; details: any }[],
};

// --- GAME STATE ---
let gameState = JSON.parse(JSON.stringify(initialGameState)); // Deep copy for easy reset


// --- AUTOSAVE FUNCTIONS ---
/**
 * Saves the current game state to localStorage.
 */
function saveGame() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
        console.log(`Game saved at week ${gameState.week}`);
    } catch (error) {
        console.error("Failed to save game:", error);
        showFeedback('❌', 'Autosave failed!');
    }
}

/**
 * Loads the game state from localStorage.
 * @returns {boolean} True if a game was successfully loaded, false otherwise.
 */
function loadGame(): boolean {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        try {
            const loadedState = JSON.parse(savedData);
            gameState = loadedState;
            // Backwards compatibility for games saved before certain features
            if (!gameState.npcs) {
                gameState.npcs = [];
                populateNpcPool();
            }
            if (!gameState.social.relationships) {
                 gameState.social.relationships = [];
            }
             if (!gameState.career.awards) {
                gameState.career.awards = [];
            }
            if (!gameState.scheduledEvents) {
                gameState.scheduledEvents = [];
            }
             if (!gameState.player.achievements) {
                gameState.player.achievements = [];
            }
            if (!gameState.hstarDb) {
                 gameState.hstarDb = { actors: [], projects: [] };
            }
            if (!gameState.social.dms) {
                gameState.social.dms = [];
                gameState.social.hasUnreadDms = false;
            }
             if (!gameState.social.partner) {
                gameState.social.partner = null;
            } else if (gameState.social.partner && gameState.social.partner.weeklyActionsTaken === undefined) {
                 gameState.social.partner.weeklyActionsTaken = 0;
            }
            if (!gameState.social.datingPool) {
                gameState.social.datingPool = [];
            }
            if (!gameState.player.datingPreference) {
                gameState.player.datingPreference = 'Everyone';
            }


            // Compatibility for NPC AI update
            gameState.npcs.forEach(npc => {
                if (npc.actingSkill === undefined) {
                    npc.actingSkill = 10 + Math.floor(Math.random() * 60);
                }
                if (npc.currentProjectWeeksLeft === undefined) {
                    npc.currentProjectWeeksLeft = 0;
                }
            });
            gameState.social.relationships.forEach(rel => {
                if (!rel.memory) {
                    rel.memory = [];
                }
            });

            console.log(`Game loaded at week ${gameState.week}`);
            return true;
        } catch (error) {
            console.error("Failed to load game data:", error);
            // If data is corrupted, remove it.
            localStorage.removeItem(STORAGE_KEY);
            return false;
        }
    }
    return false;
}

// --- Audition Filter State ---
let auditionFilters = {
    genre: 'All',
    pay: 'All',
    fame: 'All',
};

// --- GAME DATA ---
const AGENTS_FOR_HIRE = [
    { name: 'Sloppy Steve', commission: 0.20, skill: 20, description: 'Takes anyone. Gets you commercials.', hireThreshold: 0 },
    { name: 'Brenda Miles', commission: 0.15, skill: 50, description: 'Decent connections. Can land you TV roles.', hireThreshold: 20 },
    { name: 'Ari Goldwyn', commission: 0.10, skill: 85, description: 'The best in the business. Works only with stars.', hireThreshold: 50 }
];

const PROJECT_ADJECTIVES = ['Rising', 'Last', 'Eternal', 'Silent', 'Forgotten', 'Cosmic', 'Midnight'];
const PROJECT_NOUNS = ['Echoes', 'Shadows', 'Legacy', 'Gambit', 'Sunrise', 'Voyage', 'Reckoning'];

const NPC_NAMES = [
    "Alex Ray", "Jordan Smith", "Casey Bell", "Taylor Kim", "Morgan Lee", "Sam Rivera",
    "Liam Garcia", "Olivia Chen", "Noah Patel", "Emma Schmidt", "Mason Williams", "Ava Nguyen",
    "Elijah Martinez", "Sophia Rodriguez", "James Johnson", "Isabella Brown", "William Davis", "Mia Miller",
    "Ava Chen", "Leo Rodriguez", "Sofia Rossi", "Kenji Tanaka", "Isabelle Dubois", "Marcus Thorne", "Elena Petrova"
];

const PERSONALITY_TRAITS: PersonalityTrait[] = ['Friendly', 'Ambitious', 'Diva', 'Method Actor', 'Professional', 'Insecure', 'Jokester'];

const allActivities: Activity[] = [
    // Personal
    { id: 'fitness', name: 'Go to the Gym', category: 'Personal', description: 'Stay in shape for demanding roles.', cost: 50, icon: '💪', effects: { health: 5, happiness: 2, cash: -50 }, logMessage: 'You hit the gym and feel great.' },
    { id: 'meditate', name: 'Meditate', category: 'Personal', description: 'Clear your mind and reduce stress.', cost: 0, icon: '🧘', effects: { health: 2, happiness: 5 }, logMessage: 'A moment of peace brings you clarity.' },
    { id: 'shopping', name: 'Go Shopping', category: 'Personal', description: 'Retail therapy can be a good pick-me-up.', cost: 500, icon: '🛍️', effects: { happiness: 7, cash: -500 }, logMessage: 'You bought some nice things.' },
    // Career
    { id: 'acting_class', name: 'Take Acting Class', category: 'Career', description: 'Hone your craft with a professional coach.', cost: 250, icon: '🎭', effects: { actingSkill: 3, cash: -250 }, logMessage: 'The acting class was insightful. Your skill improves.' },
    { id: 'networking', name: 'Network', category: 'Career', description: 'Mingle with industry insiders. Might lead to opportunities.', cost: 100, icon: '🤝', effects: { reputation: 2, cash: -100 }, logMessage: 'You made a few connections at an industry event.' },
    // Social
    { id: 'call_family', name: 'Call Family', category: 'Social', description: 'Stay grounded and remember where you came from.', cost: 0, icon: '👨‍👩‍👧‍👦', effects: { happiness: 5 }, logMessage: 'You had a nice chat with your family.' },
    { id: 'charity', name: 'Attend Charity Gala', category: 'Social', description: 'Be seen supporting a good cause.', cost: 1000, icon: '💖', effects: { reputation: 5, fame: 1, cash: -1000 }, logMessage: 'Your appearance at the charity gala was well-received.' },
    // Mischief
    { id: 'twitter_beef', name: 'Start Twitter Beef', category: 'Mischief', description: 'Stir up drama online for a quick fame boost. Risky!', cost: 0, icon: '🔥', effects: { fame: 5, reputation: -10 }, logMessage: 'Your controversial tweets are trending... for better or worse.' },
    { id: 'leak_rumor', name: 'Leak a Rumor', category: 'Mischief', description: 'Anonymously leak a rumor about a rival.', cost: 0, icon: '🤫', effects: { fame: 2, reputation: -5 }, logMessage: 'A juicy rumor is spreading, and no one knows it came from you.' },
];

const SHOP_ITEMS: ShopItem[] = [
    // Real Estate
    { id: 'apt_studio', name: 'Studio Apartment', category: 'Real Estate', icon: '🏢', price: 120000, weeklyUpkeep: 300, happinessBoost: 5, reputationBoost: 1 },
    { id: 'apt_loft', name: 'Trendy Loft Apt', category: 'Real Estate', icon: '🏙️', price: 250000, weeklyUpkeep: 500, happinessBoost: 10, reputationBoost: 2 },
    { id: 'house_suburban', name: 'Suburban House', category: 'Real Estate', icon: '🏡', price: 600000, weeklyUpkeep: 1200, happinessBoost: 15, reputationBoost: 5 },
    { id: 'condo_luxury', name: 'Luxury Condo', category: 'Real Estate', icon: '🌇', price: 1500000, weeklyUpkeep: 2500, happinessBoost: 20, reputationBoost: 10 },
    { id: 'villa_hills', name: 'Hollywood Hills Villa', category: 'Real Estate', icon: '🏛️', price: 5000000, weeklyUpkeep: 8000, happinessBoost: 25, reputationBoost: 15 },
    { id: 'mansion_malibu', name: 'Malibu Beachfront Mansion', category: 'Real Estate', icon: '🏰', price: 20000000, weeklyUpkeep: 25000, happinessBoost: 35, reputationBoost: 25 },

    // Vehicles
    { id: 'car_used', name: 'Used Sedan', category: 'Vehicles', icon: '🚗', price: 8000, weeklyUpkeep: 50, happinessBoost: 2, reputationBoost: 0 },
    { id: 'car_suv', name: 'Luxury SUV', category: 'Vehicles', icon: '🚙', price: 65000, weeklyUpkeep: 150, happinessBoost: 7, reputationBoost: 2 },
    { id: 'car_sports', name: 'Sports Car', category: 'Vehicles', icon: '🏎️', price: 120000, weeklyUpkeep: 300, happinessBoost: 10, reputationBoost: 5 },
    { id: 'car_vintage', name: 'Vintage Convertible', category: 'Vehicles', icon: '🚘', price: 200000, weeklyUpkeep: 400, happinessBoost: 12, reputationBoost: 7 },
    { id: 'car_super', name: 'Supercar', category: 'Vehicles', icon: '🚀', price: 750000, weeklyUpkeep: 1500, happinessBoost: 20, reputationBoost: 15 },
    { id: 'jet_private', name: 'Private Jet', category: 'Vehicles', icon: '✈️', price: 10000000, weeklyUpkeep: 20000, happinessBoost: 30, reputationBoost: 20 },

    // Luxury Goods
    { id: 'handbag_designer', name: 'Designer Handbag', category: 'Luxury Goods', icon: '👜', price: 5000, weeklyUpkeep: 0, happinessBoost: 3, reputationBoost: 1 },
    { id: 'watch_luxury', name: 'Luxury Watch', category: 'Luxury Goods', icon: '⌚', price: 15000, weeklyUpkeep: 0, happinessBoost: 5, reputationBoost: 2 },
    { id: 'gown_couture', name: 'Haute Couture Gown', category: 'Luxury Goods', icon: '👗', price: 50000, weeklyUpkeep: 0, happinessBoost: 8, reputationBoost: 4 },
    { id: 'jewelry_custom', name: 'Custom Jewelry', category: 'Luxury Goods', icon: '💎', price: 250000, weeklyUpkeep: 0, happinessBoost: 15, reputationBoost: 8 },
    { id: 'art_collection', name: 'Art Collection', category: 'Luxury Goods', icon: '🎨', price: 1000000, weeklyUpkeep: 1000, happinessBoost: 18, reputationBoost: 12 },
    { id: 'yacht', name: 'Super Yacht', category: 'Luxury Goods', icon: '🛥️', price: 15000000, weeklyUpkeep: 18000, happinessBoost: 40, reputationBoost: 30 },
];

const BACKGROUNDS: Background[] = [
    {
        id: 'theatre_kid', name: 'Theatre Kid', icon: '🎭',
        description: 'You lived and breathed the stage. Great foundational skills, but a bit dramatic.',
        apply: (state) => {
            state.stats.actingSkill += 10;
            state.stats.happiness += 5;
            state.stats.reputation -= 5;
            state.wealth.cash -= 500;
        }
    },
    {
        id: 'nepo_baby', name: 'Nepotism Hire', icon: ' nepotism',
        description: 'Your famous parent opened doors for you. You start with connections, but have to prove you belong.',
        apply: (state) => {
            state.stats.fame += 10;
            state.stats.reputation += 15;
            state.stats.actingSkill -= 5;
            state.wealth.cash += 10000;
        }
    },
    {
        id: 'indie_darling', name: 'Indie Darling', icon: '🎬',
        description: 'You cut your teeth on low-budget passion projects. High artistic integrity, but you\'re broke.',
        apply: (state) => {
            state.stats.actingSkill += 5;
            state.stats.reputation += 10;
            state.stats.fame -= 5;
            state.wealth.cash = 500;
        }
    },
];

const ACHIEVEMENTS: Achievement[] = [
    { id: 'first_role', name: 'The Beginning', description: 'Complete your very first professional role.', icon: '🎬', condition: (state) => state.career.completedRoles.length >= 1 },
    { id: 'first_lead', name: 'Leading Star', description: 'Land and complete your first leading role.', icon: '🌟', condition: (state) => state.career.completedRoles.some(r => r.roleType === 'Lead') },
    { id: 'millionaire', name: 'Millionaire', description: 'Have over $1,000,000 cash in the bank.', icon: '💰', condition: (state) => state.wealth.cash >= 1000000 },
    { id: 'award_nomination', name: 'Recognized Talent', description: 'Receive your first nomination for a Galaxy Award.', icon: '✨', condition: (state) => state.career.awards.length > 0 },
    { id: 'award_win', name: 'Award Winner', description: 'Win a prestigious Galaxy Award.', icon: '🏆', condition: (state) => state.career.awards.some(a => a.won) },
    { id: 'a_lister', name: 'A-Lister', description: 'Achieve a fame level of 80 or higher.', icon: '⭐', condition: (state) => state.stats.fame >= 80 },
    { id: 'property_owner', name: 'Real Estate Mogul', description: 'Own a property worth over $1,000,000.', icon: '🏡', condition: (state) => state.wealth.assets.some(a => a.category === 'Real Estate' && a.purchasePrice >= 1000000) },
    { id: 'superstar', name: 'Superstar', description: 'Have over 1,000,000 followers on HGram.', icon: '📱', condition: (state) => state.social.followers >= 1000000 },
];

// --- UTILITY FUNCTIONS ---
function addLog(message: string) {
    gameState.log.unshift(`W${gameState.week}: ${message}`);
}

function showFeedback(icon: string, message: string) {
    const feedbackEl = document.createElement('div');
    feedbackEl.className = 'feedback-popup';
    feedbackEl.innerHTML = `<span class="icon">${icon}</span> <span class="message">${message}</span>`;
    feedbackContainer.appendChild(feedbackEl);

    setTimeout(() => {
        feedbackEl.classList.add('visible');
    }, 10);

    setTimeout(() => {
        feedbackEl.classList.remove('visible');
        setTimeout(() => feedbackEl.remove(), 500);
    }, 4000);
}

function checkAndGrantAchievements() {
    ACHIEVEMENTS.forEach(ach => {
        if (!gameState.player.achievements.includes(ach.id) && ach.condition(gameState)) {
            gameState.player.achievements.push(ach.id);
            showFeedback(`🏆`, `Achievement: ${ach.name}`);
            addLog(`Achievement Unlocked: ${ach.name}.`);
        }
    });
}

// --- RENDER FUNCTIONS & UI LOGIC ---

/**
 * Renders the main stats header.
 */
function renderHeader() {
    if (!statsHeader) return;
    const { health, happiness, fame } = gameState.stats;
    const { cash } = gameState.wealth;
    statsHeader.innerHTML = ``; // Clear previous content

    statsHeader.innerHTML = `
        <div class="stat-display" title="Health: ${health}/100">
            <span class="stat-icon">❤️</span>
            <div class="progress-bar-container">
                <div class="progress-bar-inner" style="width: ${health}%; background-color: #CF6679;"></div>
            </div>
        </div>
        <div class="stat-display" title="Happiness: ${happiness}/100">
            <span class="stat-icon">😊</span>
            <div class="progress-bar-container">
                <div class="progress-bar-inner" style="width: ${happiness}%; background-color: #03DAC6;"></div>
            </div>
        </div>
        <div class="stat-display" title="Fame: ${fame}/100">
            <span class="stat-icon">⭐</span>
            <div class="progress-bar-container">
                <div class="progress-bar-inner" style="width: ${Math.min(fame, 100)}%;"></div>
            </div>
        </div>
        <div class="stat-display" title="Cash">
            <span class="stat-icon">💰</span>
            <span class="stat-value-text">$${cash.toLocaleString()}</span>
        </div>
    `;

    const infoRow = document.createElement('div');
    infoRow.className = 'stats-header-info-row';
    infoRow.innerHTML = `
        <span>${gameState.player.name}, Age ${gameState.age}</span>
        <span>Week ${gameState.week}</span>
    `;
    statsHeader.appendChild(infoRow);
}

/**
 * Renders the dashboard view, primarily the event log.
 */
function renderDashboard() {
    const dashboardView = document.getElementById('dashboard-view');
    if (!dashboardView) return;

    const logHtml = gameState.log.slice(0, 15).map(entry =>
        `<p>${entry}</p>`
    ).join('');

    dashboardView.innerHTML = `
        <h2>Dashboard</h2>
        <div id="event-log">
            ${gameState.log.length > 0 ? logHtml : '<p>Your career is just beginning. Click "Continue Week" to see what happens!</p>'}
        </div>
    `;
}

function performActivity(activityId: string) {
    const activity = allActivities.find(a => a.id === activityId);
    if (!activity) return;

    if (gameState.wealth.cash < activity.cost) {
        showFeedback('⚠️', "Not enough cash!");
        return;
    }

    // Apply effects
    gameState.wealth.cash -= activity.cost;
    if (activity.effects.health) gameState.stats.health = Math.min(100, gameState.stats.health + activity.effects.health);
    if (activity.effects.happiness) gameState.stats.happiness = Math.min(100, gameState.stats.happiness + activity.effects.happiness);
    if (activity.effects.fame) gameState.stats.fame += activity.effects.fame;
    if (activity.effects.reputation) gameState.stats.reputation = Math.max(0, Math.min(100, gameState.stats.reputation + activity.effects.reputation));
    if (activity.effects.actingSkill) gameState.stats.actingSkill += activity.effects.actingSkill;

    addLog(activity.logMessage);
    showFeedback(activity.icon, activity.name);
    renderHeader();
    renderDashboard();
    saveGame();
}

function buyShopItem(itemId: string) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return;

    if (gameState.wealth.assets.some(a => a.id === item.id)) {
        showFeedback('⚠️', "You already own this item.");
        return;
    }

    if (gameState.wealth.cash < item.price) {
        showFeedback('⚠️', "Not enough cash!");
        return;
    }

    // Process purchase
    gameState.wealth.cash -= item.price;
    const newAsset: Asset = {
        id: item.id,
        name: item.name,
        category: item.category,
        purchasePrice: item.price,
        weeklyUpkeep: item.weeklyUpkeep,
    };
    gameState.wealth.assets.push(newAsset);
    gameState.wealth.expenses += item.weeklyUpkeep;

    // Apply boosts
    gameState.stats.happiness = Math.min(100, gameState.stats.happiness + item.happinessBoost);
    gameState.stats.reputation = Math.min(100, gameState.stats.reputation + item.reputationBoost);

    addLog(`You purchased a ${item.name} for $${item.price.toLocaleString()}.`);
    showFeedback(item.icon, `Purchased ${item.name}!`);

    // Re-render
    renderHeader();
    renderWealthView();
    saveGame();
}


function renderActivitiesView() {
    const container = document.getElementById('activities-container');
    if (!container) return;

    const activitiesHtml = allActivities.map(activity => {
        const effectsHtml = Object.entries(activity.effects)
            .filter(([key, value]) => key !== 'cash') // Don't show cash effect here
            .map(([key, value]) => {
                const formattedKey = key.replace('Skill', ' Skill').replace(/([A-Z])/g, ' $1').trim();
                return `<span class="stat-effect ${value > 0 ? 'positive' : 'negative'}">${value > 0 ? '+' : ''}${value} ${formattedKey}</span>`;
            }).join('');

        return `
        <div class="activity-card" id="activity-${activity.id}">
            <div>
                <div class="activity-card-header">
                    <span class="icon">${activity.icon}</span>
                    <h4>${activity.name}</h4>
                </div>
                <p class="description">${activity.description}</p>
            </div>
            <div class="activity-card-footer">
                <div>
                    <div class="stat-effects">${effectsHtml}</div>
                    <span class="cost ${activity.cost > 0 ? 'negative' : ''}">$${activity.cost.toLocaleString()}</span>
                </div>
                <button class="do-activity-btn" data-id="${activity.id}">Do It</button>
            </div>
        </div>
        `;
    }).join('');

    container.innerHTML = `<div class="activities-grid">${activitiesHtml}</div>`;

    container.querySelectorAll('.do-activity-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            performActivity((e.currentTarget as HTMLButtonElement).dataset.id!);
        });
    });
}

function renderWealthView() {
    const view = document.getElementById('wealth-view');
    if (!view) return;

    let contentHtml = '';
    switch (wealthViewState) {
        case 'overview':
            const { cash, income, expenses } = gameState.wealth;
            const net = income - expenses;
            contentHtml = `
                <div class="wealth-summary-card">
                    <div class="summary-item">
                        <span class="label">Weekly Income</span>
                        <span class="value income">$${income.toLocaleString()}</span>
                    </div>
                     <div class="summary-item">
                        <span class="label">Weekly Expenses</span>
                        <span class="value expenses">$${expenses.toLocaleString()}</span>
                    </div>
                     <div class="summary-item total">
                        <span class="label">Net Weekly Cashflow</span>
                        <span class="value ${net >= 0 ? 'income' : 'expenses'}">$${net.toLocaleString()}</span>
                    </div>
                </div>
                <h3>Financial History</h3>
                <div class="chart-container" style="height: 250px;">
                    <canvas id="wealth-chart-main"></canvas>
                </div>
            `;
            break;
        case 'shop':
            const shopItems = SHOP_ITEMS.filter(item => item.category === activeShopCategory);
            contentHtml = `
                 <div class="shop-category-nav">
                    <button data-category="Real Estate" class="${activeShopCategory === 'Real Estate' ? 'active' : ''}">Real Estate</button>
                    <button data-category="Vehicles" class="${activeShopCategory === 'Vehicles' ? 'active' : ''}">Vehicles</button>
                    <button data-category="Luxury Goods" class="${activeShopCategory === 'Luxury Goods' ? 'active' : ''}">Luxury Goods</button>
                </div>
                <div class="shop-grid">
                    ${shopItems.map(item => {
                        const isOwned = gameState.wealth.assets.some(a => a.id === item.id);
                        return `
                        <div class="shop-item-card">
                            <span class="item-icon">${item.icon}</span>
                            <div class="item-details">
                                <h4 class="item-name">${item.name}</h4>
                                <p class="item-price">$${item.price.toLocaleString()}</p>
                                <p class="item-upkeep">Upkeep: $${item.weeklyUpkeep.toLocaleString()}/week</p>
                            </div>
                            <button class="item-buy-btn" data-id="${item.id}" ${isOwned ? 'disabled' : ''}>${isOwned ? 'Owned' : 'Buy'}</button>
                        </div>
                        `;
                    }).join('')}
                </div>
            `;
            break;
        case 'assets':
             if (gameState.wealth.assets.length === 0) {
                contentHtml = `<p class="no-content-message">You do not own any assets.</p>`;
            } else {
                 contentHtml = `
                    <div class="assets-grid">
                    ${gameState.wealth.assets.map(asset => `
                        <div class="asset-card">
                            <h4>${asset.name}</h4>
                            <p>Price: $${asset.purchasePrice.toLocaleString()}</p>
                            <p class="asset-upkeep">Upkeep: $${asset.weeklyUpkeep.toLocaleString()}/week</p>
                        </div>
                    `).join('')}
                    </div>
                 `;
            }
            break;
    }


    view.innerHTML = `
        <h2>Wealth & Investments</h2>
        <div class="wealth-nav">
            <button data-tab="overview" class="${wealthViewState === 'overview' ? 'active' : ''}">Overview</button>
            <button data-tab="shop" class="${wealthViewState === 'shop' ? 'active' : ''}">Shop</button>
            <button data-tab="assets" class="${wealthViewState === 'assets' ? 'active' : ''}">My Assets</button>
        </div>
        <div id="wealth-content">${contentHtml}</div>
    `;

    if (wealthViewState === 'overview' || wealthViewState === 'shop') {
        initializeOrUpdateCharts();
    }
}

function renderColleaguesView(): string {
    const relationships = gameState.social.relationships.filter(rel => rel.status !== 'Acquaintance');

    if (relationships.length === 0) {
        return `<p class="no-content-message">You haven't formed any significant relationships yet. Interact with colleagues on set to build connections.</p>`;
    }

    return relationships.sort((a, b) => Math.abs(b.relationshipScore) - Math.abs(a.relationshipScore)).map(rel => {
        const npc = gameState.npcs.find(n => n.id === rel.npcId);
        if (!npc) return '';

        const score = rel.relationshipScore;
        const color = score > 50 ? 'var(--success-color)' : score < -50 ? 'var(--error-color)' : 'var(--accent-color)';
        const progress = (score + 100) / 2;
        return `
        <div class="relationship-card">
            <div class="relationship-info">
                <strong>${npc.name}</strong>
                <small>${npc.profession} (${rel.status})</small>
            </div>
            <div class="relationship-status">
                <div class="progress-bar-container">
                    <div class="progress-bar-inner" style="width: ${progress}%; background-color: ${color};"></div>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

function renderDatingView(): string {
    const { partner, datingPool } = gameState.social;
    const { datingPreference } = gameState.player;

    if (partner) {
        const actionsDisabled = partner.weeklyActionsTaken > 0;
        return `
            <div class="partner-card">
                <h3>Current Partner</h3>
                <div class="partner-info">
                    <span class="partner-portrait">${partner.portrait}</span>
                    <div class="partner-details">
                        <h4>${partner.name}, ${partner.age}</h4>
                        <p>${partner.profession} (${partner.gender})</p>
                        <small>Together for ${partner.weeksTogether} weeks</small>
                    </div>
                </div>
                <div class="partner-relationship-status">
                    <div class="on-set-progress-bar-label">
                        <span>Relationship</span>
                        <span>${partner.relationshipScore}%</span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar-inner" style="width: ${partner.relationshipScore}%; background-color: var(--success-color);"></div>
                    </div>
                </div>
                
                <div class="partner-activities-container">
                    <h4>Weekly Activity</h4>
                    <div class="partner-activities-grid">
                        <button class="partner-activity-btn" data-action="fancy-date" ${actionsDisabled ? 'disabled' : ''}>
                            <span class="icon">🥂</span><strong>Fancy Date</strong><small>$500</small>
                        </button>
                        <button class="partner-activity-btn" data-action="night-in" ${actionsDisabled ? 'disabled' : ''}>
                            <span class="icon">🍿</span><strong>Quiet Night In</strong><small>Free</small>
                        </button>
                        <button class="partner-activity-btn" data-action="deep-convo" ${actionsDisabled ? 'disabled' : ''}>
                             <span class="icon">💬</span><strong>Deep Talk</strong><small>+Insight</small>
                        </button>
                    </div>
                     ${actionsDisabled ? '<p class="actions-taken-note">You have already spent time with your partner this week.</p>' : ''}
                </div>

                <button id="break-up-btn" class="danger-button">Break Up</button>
            </div>
        `;
    }

    // Player is single
    let datingPoolHtml = '';
    if (datingPool.length > 0) {
        datingPoolHtml = `
            <div class="dating-pool-grid">
                ${datingPool.map(profile => `
                    <div class="dating-profile-card">
                        <div class="dating-profile-header">
                            <span class="dating-profile-portrait">${profile.portrait}</span>
                            <div>
                                <strong>${profile.name}, ${profile.age}</strong>
                                <small>${profile.profession} (${profile.gender})</small>
                            </div>
                        </div>
                        <p class="dating-profile-bio">"${profile.bio}"</p>
                        <button class="go-on-date-btn" data-id="${profile.id}">Ask on Date ($200)</button>
                    </div>
                `).join('')}
            </div>
            <button id="refresh-matches-btn" class="secondary-btn full-width-margin">Find New Matches ($500)</button>
        `;
    } else {
        datingPoolHtml = `
            <div class="find-love-cta">
                <h3>Ready for Romance?</h3>
                <p>First, tell us who you're interested in meeting.</p>
                <div class="dating-preference-selector">
                    <button data-pref="Male" class="${datingPreference === 'Male' ? 'active' : ''}">Men</button>
                    <button data-pref="Female" class="${datingPreference === 'Female' ? 'active' : ''}">Women</button>
                    <button data-pref="Everyone" class="${datingPreference === 'Everyone' ? 'active' : ''}">Everyone</button>
                </div>
                <button id="generate-matches-btn">Find Matches</button>
            </div>
        `;
    }

    return `<div id="dating-app-container">${datingPoolHtml}</div>`;
}


function renderRelationshipsView() {
    const view = document.getElementById('relationships-view');
    if (!view) return;

    let contentHtml = '';
    if (activeRelationshipView === 'colleagues') {
        contentHtml = renderColleaguesView();
    } else { // 'dating'
        contentHtml = renderDatingView();
    }

    view.innerHTML = `
        <h2>Relationships</h2>
        <div class="relationships-nav">
            <button data-tab="colleagues" class="${activeRelationshipView === 'colleagues' ? 'active' : ''}">Colleagues</button>
            <button data-tab="dating" class="${activeRelationshipView === 'dating' ? 'active' : ''}">Love Life</button>
        </div>
        <div id="relationships-content">
            ${contentHtml}
        </div>
    `;
}

async function generateDatingProfiles(isRefresh = false) {
    const cost = isRefresh ? 500 : 0;
    if (gameState.wealth.cash < cost) {
        showFeedback('⚠️', 'Not enough cash!');
        return;
    }
    gameState.wealth.cash -= cost;
    renderHeader();

    // Show loading state
    const container = document.getElementById('dating-app-container');
    if (container) {
        container.innerHTML = '<div class="loading-spinner"></div><p class="loading-text">Finding potential partners...</p>';
    }

    try {
        let preferenceText = '';
        switch(gameState.player.datingPreference) {
            case 'Male': preferenceText = 'men'; break;
            case 'Female': preferenceText = 'women'; break;
            case 'Everyone': preferenceText = 'people of any gender'; break;
        }

        const prompt = `You are a data generator for a life simulator game.
        The player is ${gameState.player.name}, a ${gameState.age}-year-old movie star, who is interested in dating ${preferenceText}.
        Generate 3 diverse and interesting dating profiles for people living in or around Los Angeles. They should not all be in the film industry.
        
        Provide a JSON object with a single key "profiles" which is an array of 3 profile objects.
        Each profile object must have these keys:
        - "name": A realistic name.
        - "age": An age between ${gameState.age - 5} and ${gameState.age + 8}.
        - "gender": The person's gender ('Male', 'Female', or 'Non-binary'). This MUST align with the player's stated preference.
        - "profession": A profession.
        - "bio": A short, catchy, first-person bio (1-2 sentences).
        - "portrait": A single emoji representing the person.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        profiles: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    age: { type: Type.NUMBER },
                                    gender: { type: Type.STRING },
                                    profession: { type: Type.STRING },
                                    bio: { type: Type.STRING },
                                    portrait: { type: Type.STRING },
                                },
                                required: ["name", "age", "gender", "profession", "bio", "portrait"]
                            }
                        }
                    },
                    required: ["profiles"]
                }
            }
        });

        const data = JSON.parse(response.text);
        gameState.social.datingPool = data.profiles.map((p: any) => ({ ...p, id: `profile_${Math.random()}` }));
        
        showFeedback('💖', 'Found new matches!');
    } catch (error) {
        console.error("Error generating dating profiles:", error);
        showFeedback('❌', 'Could not find matches right now.');
        gameState.social.datingPool = []; // Clear on error
    }

    renderRelationshipsView();
}

function goOnDate(profileId: string) {
    const cost = 200;
    if (gameState.wealth.cash < cost) {
        showFeedback('⚠️', 'Not enough cash for a date!');
        return;
    }
    const profile = gameState.social.datingPool.find(p => p.id === profileId);
    if (!profile) return;

    gameState.wealth.cash -= cost;
    gameState.social.datingPool = gameState.social.datingPool.filter(p => p.id !== profileId);

    gameState.scheduledEvents.push({
        weeksLeft: 1,
        type: 'FIRST_DATE',
        details: { profile }
    });
    
    addLog(`You're going on a date with ${profile.name}.`);
    showFeedback('❤️', `Date scheduled with ${profile.name}!`);
    renderRelationshipsView();
    renderHeader();
}

function breakUp() {
    if (!gameState.social.partner) return;
    const exPartnerName = gameState.social.partner.name;
    gameState.social.partner = null;
    gameState.social.status = 'Single';
    gameState.stats.happiness = Math.max(0, gameState.stats.happiness - 25); // Big happiness hit
    addLog(`You broke up with ${exPartnerName}. It was a painful decision.`);
    showFeedback('💔', `Broke up with ${exPartnerName}`);
    renderHeader();
    renderRelationshipsView();
}

async function haveDeepConversation() {
    if (!gameState.social.partner || gameState.social.partner.weeklyActionsTaken > 0) return;

    gameState.social.partner.weeklyActionsTaken++;

    modalIcon.innerHTML = '💬';
    modalTitle.textContent = `Talking with ${gameState.social.partner.name}...`;
    modalText.innerHTML = 'The AI is generating a scenario. Please wait.';
    modalChoices.innerHTML = '<div class="loading-spinner"></div>';
    modalBackdrop.classList.remove('hidden');

    const partner = gameState.social.partner;

    const prompt = `You are a story generator for a life simulator game. The player is in a relationship.
    
    Player: ${gameState.player.name}, a ${gameState.age}-year-old movie star.
    Partner: ${partner.name}, a ${partner.age}-year-old ${partner.profession}.
    Relationship Status: They have been together for ${partner.weeksTogether} weeks and their current relationship score is ${partner.relationshipScore}/100.

    Task:
    Generate a short scenario about a deep conversation topic that comes up between them.
    1. "scenario": A short, one-sentence description of the conversation's outcome for the game log.
    2. "relationshipChange": A number between -15 and 20 representing how the conversation affected their relationship.
    
    Provide a JSON object with these two keys.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        scenario: { type: Type.STRING },
                        relationshipChange: { type: Type.NUMBER }
                    },
                    required: ["scenario", "relationshipChange"]
                },
            },
        });

        const result = JSON.parse(response.text);
        partner.relationshipScore = Math.max(0, Math.min(100, partner.relationshipScore + result.relationshipChange));

        addLog(result.scenario);
        showFeedback(result.relationshipChange >= 0 ? '❤️' : '😕', 'You had a deep conversation.');
        
    } catch (error) {
        console.error("Deep conversation generation error:", error);
        addLog("You and your partner had a talk, but it was hard to read the room.");
    } finally {
        modalBackdrop.classList.add('hidden');
        renderRelationshipsView();
    }
}


function performPartnerActivity(action: string) {
    const { partner } = gameState.social;
    if (!partner || partner.weeklyActionsTaken > 0) return;

    switch(action) {
        case 'fancy-date':
            const dateCost = 500;
            if (gameState.wealth.cash < dateCost) {
                showFeedback('⚠️', 'Not enough cash for a fancy date!');
                return;
            }
            gameState.wealth.cash -= dateCost;
            partner.relationshipScore = Math.min(100, partner.relationshipScore + 10);
            gameState.stats.happiness = Math.min(100, gameState.stats.happiness + 8);
            addLog(`You and ${partner.name} went on a luxurious date. It was wonderful.`);
            showFeedback('🥂', 'A night to remember!');
            partner.weeklyActionsTaken++;
            break;
        
        case 'night-in':
            partner.relationshipScore = Math.min(100, partner.relationshipScore + 5);
            gameState.stats.happiness = Math.min(100, gameState.stats.happiness + 5);
            addLog(`You and ${partner.name} spent a cozy night in, enjoying each other's company.`);
            showFeedback('🍿', 'A perfectly relaxing evening.');
            partner.weeklyActionsTaken++;
            break;

        case 'deep-convo':
            haveDeepConversation();
            break;
    }
    renderHeader();
    renderRelationshipsView();
}


function renderHStarDBMainView(): string {
    // Sort actors and projects by popularity/rating
    const topActors = [...gameState.hstarDb.actors].sort((a, b) => b.popularityRating - a.popularityRating).slice(0, 5);
    const topProjects = [...gameState.hstarDb.projects].sort((a, b) => b.rating - a.rating).slice(0, 5);

    return `
        <h2>HStarDB</h2>
        <div class="hstardb-search-container">
            <input type="search" placeholder="Search actors, projects..." id="hstardb-search-input" disabled>
        </div>
        <div class="hstardb-rankings-grid">
            <div class="hstardb-ranking-list">
                <h3>⭐ Top Actors</h3>
                ${topActors.map(actor => `
                    <button class="ranking-item" data-id="${actor.id}" data-type="actor">
                        <span>${actor.name}</span>
                        <span class="ranking-score">${actor.popularityRating}</span>
                    </button>
                `).join('')}
            </div>
            <div class="hstardb-ranking-list">
                <h3>🎬 Top Projects</h3>
                 ${topProjects.map(project => `
                    <button class="ranking-item" data-id="${project.id}" data-type="project">
                        <span>${project.title}</span>
                        <span class="ranking-score">${project.rating.toFixed(1)}</span>
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

function renderHStarDBProjectDetailView(projectId: string): string {
    const project = gameState.hstarDb.projects.find(p => p.id === projectId);
    if (!project) {
        return `<p>Project not found.</p><button class="hstardb-back-btn">← Back</button>`;
    }

    const resultClass = project.boxOffice.toLowerCase().replace(/ /g, '-');
    
    return `
        <button class="back-button hstardb-back-btn">← Back to HStarDB</button>
        <div class="hstardb-profile-header">
            <h1>${project.title} <span class="project-year">(${project.year})</span></h1>
            <p>${project.genre} • Directed by ${project.director}</p>
        </div>

        <div class="hstardb-project-ratings-container">
            <div>
                <span class="rating-score">${project.rating.toFixed(1)}<span class="rating-base">/10</span></span>
                <span class="rating-label">Critic Score</span>
            </div>
             <div>
                <span class="rating-score">${project.audienceRating.toFixed(1)}<span class="rating-base">/10</span></span>
                <span class="rating-label">Audience Score</span>
            </div>
        </div>

        <div class="profile-section-card">
            <h3>Box Office</h3>
            <div class="hstardb-project-details">
                <span>Result</span><strong class="box-office-result-badge ${resultClass}">${project.boxOffice}</strong>
                <span>Budget</span><strong>$${project.budget.toLocaleString()}</strong>
                <span>Worldwide Gross</span><strong>$${project.worldwideGross.toLocaleString()}</strong>
            </div>
        </div>

        <div class="profile-section-card">
            <h3>Cast</h3>
            <div class="hstardb-cast-list">
                ${project.cast.map(member => {
                    const actorInDb = gameState.hstarDb.actors.find(a => a.id === member.actorId);
                    const actorName = actorInDb ? actorInDb.name : 'Unknown';
                    return `<button class="cast-member" data-id="${member.actorId}" data-type="actor">${actorName}</button>`;
                }).join('')}
            </div>
        </div>
        
         <div class="profile-section-card">
            <h3>Fan Reviews</h3>
            <div class="hstardb-fan-reviews">
                ${project.reviews.length > 0 ? project.reviews.map(review => `<div class="fan-review-card">"${review}"</div>`).join('') : '<p class="no-content-message">No reviews yet.</p>'}
            </div>
        </div>
    `;
}

function renderHStarDBActorDetailView(actorId: string): string {
    const actor = gameState.hstarDb.actors.find(a => a.id === actorId);

    if (!actor) {
        return `<p>Actor not found.</p><button class="back-button hstardb-back-btn">← Back</button>`;
    }

    const avatarHtml = actor.isPlayer
        ? generateAvatarSVG(gameState.player.appearance)
        : `<svg viewBox="0 0 100 100"><rect x="0" y="0" width="100" height="100" fill="#2C2C31"/><text x="50" y="60" font-size="40" text-anchor="middle" fill="#FFF">👤</text></svg>`;

    const filmographyHtml = actor.filmography.length === 0
        ? `<p class="no-content-message">No projects yet.</p>`
        : `<table class="filmography-table">
            <tbody>
                ${actor.filmography.map(projId => {
                    const project = gameState.hstarDb.projects.find(p => p.id === projId);
                    if (!project) return '';
                    return `
                        <tr class="ranking-item" data-id="${project.id}" data-type="project" style="cursor: pointer;">
                            <td><strong>${project.title}</strong> (${project.year})</td>
                            <td>${project.boxOffice}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
           </table>`;
        
    const awardsHtml = actor.awards.length === 0
        ? `<p class="no-content-message">No awards or nominations yet.</p>`
        : `<ul>${[...actor.awards].reverse().map(award => `
            <li>
                ${award.won ? `<span class="award-win">🏆 WIN</span>` : `<span class="award-nomination">NOMINATION</span>`}
                for <strong>${award.award}</strong> in "${award.project}" (${award.year})
            </li>
        `).join('')}</ul>`;

    const achievementsHtml = actor.isPlayer && gameState.player.achievements.length > 0
        ? `<div id="achievements-grid">${gameState.player.achievements.map(achId => {
                const ach = ACHIEVEMENTS.find(a => a.id === achId);
                if (!ach) return '';
                return `
                <div class="achievement-badge" title="${ach.name}: ${ach.description}">
                    <span class="icon">${ach.icon}</span>
                </div>
                `;
            }).join('')}</div>`
        : `<p class="no-content-message">No achievements unlocked yet.</p>`;

    return `
        <button class="back-button hstardb-back-btn">← Back to HStarDB</button>
        <div class="hstardb-player-header">
            <div class="hstardb-player-avatar">
                ${avatarHtml}
            </div>
            <div class="hstardb-player-info">
                <h2>${actor.name}</h2>
                <p>Age ${actor.age} • ${actor.nationality}</p>
            </div>
            <div class="hstardb-starmeter" title="Popularity: ${actor.popularityRating}/100">
                <div class="starmeter-bar" style="width: ${actor.popularityRating}%;"></div>
                <span>Starmeter</span>
            </div>
        </div>

        <div class="hstardb-player-profile-grid">
            <div class="hstardb-profile-card">
                <h3>Filmography</h3>
                ${filmographyHtml}
            </div>
            <div class="hstardb-profile-card">
                <h3>Awards & Recognition</h3>
                ${awardsHtml}
            </div>
            ${actor.isPlayer ? `
            <div class="hstardb-profile-card">
                <h3>Achievements</h3>
                ${achievementsHtml}
            </div>` : ''}
        </div>
    `;
}


function renderHStarDBView() {
    const view = document.getElementById('hstardb-view');
    if (!view) return;

    switch (hstarDbViewState.view) {
        case 'project':
            if (hstarDbViewState.selectedId) {
                view.innerHTML = renderHStarDBProjectDetailView(hstarDbViewState.selectedId);
            }
            break;
        case 'actor':
            if (hstarDbViewState.selectedId) {
                view.innerHTML = renderHStarDBActorDetailView(hstarDbViewState.selectedId);
            }
            break;
        case 'main':
        default:
            view.innerHTML = renderHStarDBMainView();
            break;
    }
}

function initializeOrUpdateCharts() {
    const statsCtx = (document.getElementById('player-stats-chart') as HTMLCanvasElement)?.getContext('2d');
    const wealthCtx = (document.getElementById('wealth-chart') as HTMLCanvasElement)?.getContext('2d');
    const wealthMainCtx = (document.getElementById('wealth-chart-main') as HTMLCanvasElement)?.getContext('2d');


    if (!statsCtx && !wealthCtx && !wealthMainCtx) return;

    const chartOptions = {
        responsive: true, maintainAspectRatio: false,
        scales: {
            y: { ticks: { color: 'rgba(245, 245, F7, 0.7)' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
            x: { ticks: { color: 'rgba(245, 245, F7, 0.7)' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }
        },
        plugins: { legend: { labels: { color: 'rgba(245, 245, F7, 0.9)' } } }
    };

    // --- Player Stats Chart (Profile) ---
    if (statsCtx) {
        const statsChartData = {
            labels: gameState.stats.history.week,
            datasets: [
                { label: 'Fame', data: gameState.stats.history.fame, borderColor: '#FFD700', tension: 0.1, fill: false },
                { label: 'Acting Skill', data: gameState.stats.history.actingSkill, borderColor: '#03DAC6', tension: 0.1, fill: false },
                { label: 'Happiness', data: gameState.stats.history.happiness, borderColor: '#BB86FC', tension: 0.1, fill: false },
            ]
        };
        if (playerStatsChart) {
            playerStatsChart.data = statsChartData;
            playerStatsChart.update();
        } else {
            playerStatsChart = new Chart(statsCtx, { type: 'line', data: statsChartData, options: chartOptions });
        }
    }


    // --- Wealth Chart (Both Profile & Wealth View) ---
    const wealthChartData = {
        labels: gameState.wealth.history.week,
        datasets: [
            { label: 'Cash', data: gameState.wealth.history.cash, borderColor: '#4CAF50', backgroundColor: 'rgba(76, 175, 80, 0.2)', tension: 0.1, fill: true },
        ]
    };

    if (wealthCtx) { // Profile view chart
         if (wealthChart) {
            // If the canvas context has changed, destroy the old chart
            if (wealthChart.canvas.id !== 'wealth-chart') {
                wealthChart.destroy();
                wealthChart = new Chart(wealthCtx, { type: 'line', data: wealthChartData, options: chartOptions });
            } else {
                wealthChart.data = wealthChartData;
                wealthChart.update();
            }
        } else {
            wealthChart = new Chart(wealthCtx, { type: 'line', data: wealthChartData, options: chartOptions });
        }
    }
     if (wealthMainCtx) { // Wealth view chart
         if (wealthChart) {
             // If the canvas context has changed, destroy the old chart
            if (wealthChart.canvas.id !== 'wealth-chart-main') {
                wealthChart.destroy();
                wealthChart = new Chart(wealthMainCtx, { type: 'line', data: wealthChartData, options: chartOptions });
            } else {
                wealthChart.data = wealthChartData;
                wealthChart.update();
            }
        } else {
            wealthChart = new Chart(wealthMainCtx, { type: 'line', data: wealthChartData, options: chartOptions });
        }
    }
}


/**
 * Renders the player's profile view, including their custom avatar.
 * This should be called whenever the player navigates to the profile screen.
 */
function renderProfileView() {
    const profilePictureContainer = document.querySelector('#profile-view .profile-picture');
    const profileStatsDisplay = document.getElementById('profile-stats-display');
    const filmographyContainer = document.getElementById('profile-filmography');
    const upcomingEventsContainer = document.getElementById('profile-upcoming-events');
    const awardsContainer = document.getElementById('profile-awards-recognition');
    const achievementsContainer = document.getElementById('profile-achievements');

    if (profilePictureContainer) {
        profilePictureContainer.innerHTML = generateAvatarSVG(gameState.player.appearance);
    }

    if (profileStatsDisplay) {
        const nameEditorHtml = `
            <div class="profile-stat-name-editor">
                <span class="profile-stat-label">Name</span>
                <div id="player-name-display-container">
                    <span class="profile-stat-value">${gameState.player.name}</span>
                    <button id="edit-name-btn" aria-label="Edit name">✏️</button>
                </div>
                <div id="player-name-input-container" class="hidden">
                    <input type="text" id="player-name-input" value="${gameState.player.name}" maxlength="20">
                    <button id="save-name-btn" aria-label="Save name">✔️</button>
                    <button id="cancel-name-btn" aria-label="Cancel name edit">❌</button>
                </div>
            </div>`;
        
        profileStatsDisplay.innerHTML = `
            ${nameEditorHtml}
            <div class="profile-stat"><span class="profile-stat-label">Age</span> <span class="profile-stat-value">${gameState.age}</span></div>
            <div class="profile-stat"><span class="profile-stat-label">Acting Skill</span> <span class="profile-stat-value">${gameState.stats.actingSkill}</span></div>
            <div class="profile-stat"><span class="profile-stat-label">Reputation</span> <span class="profile-stat-value">${gameState.stats.reputation} / 100</span></div>
            <div class="profile-stat"><span class="profile-stat-label">Followers</span> <span class="profile-stat-value">${gameState.social.followers.toLocaleString()}</span></div>
            <div class="profile-stat"><span class="profile-stat-label">Status</span> <span class="profile-stat-value">${gameState.social.status}</span></div>
        `;
    }

    if (achievementsContainer) {
        let achievementsHtml = '<h3>Achievements</h3>';
        if (gameState.player.achievements.length === 0) {
            achievementsHtml += `<p class="no-content-message">No achievements unlocked yet.</p>`;
        } else {
            achievementsHtml += `<div id="achievements-grid">${gameState.player.achievements.map(achId => {
                const ach = ACHIEVEMENTS.find(a => a.id === achId);
                if (!ach) return '';
                return `
                <div class="achievement-badge" title="${ach.name}: ${ach.description}">
                    <span class="icon">${ach.icon}</span>
                </div>
                `;
            }).join('')}</div>`;
        }
        achievementsContainer.innerHTML = `<div class="profile-section-card">${achievementsHtml}</div>`;
    }

    if (upcomingEventsContainer) {
        const awardCeremony = gameState.scheduledEvents.find(e => e.type === 'AWARD_CEREMONY');
        if (awardCeremony) {
            upcomingEventsContainer.innerHTML = `
                <div class="profile-section-card">
                    <h3>Upcoming Events</h3>
                    <div class="upcoming-event-item">
                        <div>
                            <strong>🏆 The Galaxy Awards</strong>
                            <span>The biggest night in Hollywood is approaching.</span>
                        </div>
                        <span class="weeks-left">${awardCeremony.weeksLeft} weeks</span>
                    </div>
                </div>
            `;
        } else {
            upcomingEventsContainer.innerHTML = '';
        }
    }

    if (awardsContainer) {
        let awardsHtml = '<h3>Awards & Recognition</h3>';
        if (gameState.career.awards.length === 0) {
            awardsHtml += `<p class="no-content-message">No nominations or awards yet.</p>`;
        } else {
            awardsHtml += `<ul>${[...gameState.career.awards].reverse().map(award => `
                <li>
                    ${award.won ? `<span class="award-win">🏆 WIN</span>` : `<span class="award-nomination">NOMINATION</span>`}
                    for <strong>${award.award}</strong> in "${award.project}" (${award.year})
                </li>
            `).join('')}</ul>`;
        }
        awardsContainer.innerHTML = `<div class="profile-section-card">${awardsHtml}</div>`;
    }

    if (filmographyContainer) {
        let filmographyHtml = '<h3>Filmography</h3>';
        if (gameState.career.completedRoles.length === 0) {
            filmographyHtml += `<p class="no-content-message">No completed projects yet.</p>`;
        } else {
            filmographyHtml += `<div class="filmography-list-profile">${[...gameState.career.completedRoles].reverse().map(r => {
                 const resultClass = r.boxOfficeResult.toLowerCase().replace(/ /g, '-');
                 return `
                <div class="filmography-item-profile">
                    <div class="filmography-item-header-profile">
                        <h4>${r.title} <span class="year">(${r.year})</span></h4>
                        <span class="box-office-result-badge ${resultClass}">${r.boxOfficeResult}</span>
                    </div>
                    <p class="role-info">as ${r.characterName} (${r.roleType})</p>
                    <div class="filmography-item-details-profile">
                        <div><span class="label">Performance</span><span class="value">${r.finalPerformanceScore}%</span></div>
                        <div><span class="label">Box Office</span><span class="value">$${r.boxOfficeGross.toLocaleString()}</span></div>
                        ${r.playerCut > 0 ? `<div><span class="label">Your Cut</span><span class="value income">$${r.playerCut.toLocaleString()}</span></div>` : ''}
                    </div>
                </div>
            `}).join('')}</div>`;
        }
        filmographyContainer.innerHTML = `<div class="profile-section-card">${filmographyHtml}</div>`;
    }

    initializeOrUpdateCharts();
}


async function generateHgramPost(category: HgramPostCategory) {
    modalIcon.innerHTML = '✍️';
    modalTitle.textContent = 'Generating Post...';
    modalText.innerHTML = 'The AI is crafting the perfect post for your feed. Please wait.';
    modalChoices.innerHTML = '<div class="loading-spinner"></div>';

    const categoryInfo = HGRAM_POST_CATEGORIES.find(c => c.id === category)!;
    
    let context = `The player is ${gameState.age} years old with ${gameState.stats.fame} fame. Their social media handle is @${gameState.social.handle}.`;
    if (gameState.career.currentRoles.length > 0) {
        context += ` They are currently working on a ${gameState.career.currentRoles[0].projectType} called "${gameState.career.currentRoles[0].title}".`;
    } else if (gameState.career.completedRoles.length > 0) {
        const lastProject = gameState.career.completedRoles[gameState.career.completedRoles.length - 1];
        context += ` They recently finished working on "${lastProject.title}".`;
    } else {
        context += ` They are a new actor trying to make it in Hollywood.`;
    }

    const prompt = `You are a social media manager for a rising movie star named ${gameState.player.name}.
    Current context: ${context}
    
    Generate a social media post for their HGram account. The post must be in the '${categoryInfo.name}' category.
    
    Provide a JSON object with two keys:
    1. "imageDescription": A short, vivid, third-person description of an imaginary photo for the post (e.g., "${gameState.player.name} stands on a balcony overlooking a city skyline at sunset.").
    2. "caption": A catchy first-person caption for the post. It should be engaging, use 2-3 relevant hashtags, and match the tone of the category.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        imageDescription: {
                            type: Type.STRING,
                            description: "A description of the image for the post."
                        },
                        caption: {
                            type: Type.STRING,
                            description: "The caption for the post."
                        }
                    },
                },
            },
        });

        const postContent = JSON.parse(response.text);

        const newFollowers = 50 + Math.floor(Math.random() * (gameState.stats.fame * 10));
        const newPost: Post = {
            id: `post_${gameState.week}_${Math.random()}`,
            week: gameState.week,
            age: gameState.age,
            author: gameState.player.name,
            authorHandle: gameState.social.handle,
            authorPFP: '👤',
            type: 'Player',
            category: category,
            imageDescription: postContent.imageDescription,
            caption: postContent.caption,
            likes: Math.floor(newFollowers * (10 + Math.random() * 20)),
            comments: Math.floor(newFollowers * (0.5 + Math.random() * 2)),
            shares: Math.floor(newFollowers * (0.2 + Math.random())),
        };

        gameState.social.feed.unshift(newPost);
        gameState.social.followers += newFollowers;
        gameState.stats.fame += 2;
        gameState.stats.happiness = Math.min(100, gameState.stats.happiness + 5);

        addLog(`You posted on HGram, gaining ${newFollowers.toLocaleString()} followers.`);
        showFeedback('📱', 'New post is live!');
        
        modalBackdrop.classList.add('hidden');
        renderSocialView();
        renderHeader();

    } catch (error) {
        console.error("Error generating HGram post:", error);
        modalTitle.textContent = 'Error';
        modalText.innerHTML = 'There was an issue creating your post. Please try again.';
        modalChoices.innerHTML = `<button id="modal-close-btn">Close</button>`;
        document.getElementById('modal-close-btn')?.addEventListener('click', () => modalBackdrop.classList.add('hidden'));
    }
}


function showCreatePostModal() {
    modalIcon.innerHTML = '✍️';
    modalTitle.textContent = 'Create a New Post';
    modalText.innerHTML = 'What kind of content do you want to share with your fans?';

    modalChoices.innerHTML = `
        <div class="create-post-category-grid">
            ${HGRAM_POST_CATEGORIES.map(cat => `
                <button class="category-choice-btn" data-category="${cat.id}">
                    <span class="icon">${cat.icon}</span>
                    <span>${cat.name}</span>
                </button>
            `).join('')}
        </div>
        <button id="modal-close-btn" class="secondary-btn">Cancel</button>
    `;

    modalChoices.querySelectorAll('.category-choice-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const category = (e.currentTarget as HTMLButtonElement).dataset.category as HgramPostCategory;
            generateHgramPost(category);
        });
    });

    document.getElementById('modal-close-btn')?.addEventListener('click', () => {
        modalBackdrop.classList.add('hidden');
    });

    modalBackdrop.classList.remove('hidden');
}

function renderSocialFeedView() {
     let feedHtml = '';
    if (gameState.social.feed.length === 0) {
        feedHtml = `<p class="empty-feed-message">Your feed is quiet... for now. Create your first post!</p>`;
    } else {
        feedHtml = gameState.social.feed.map(post => {
            const categoryInfo = HGRAM_POST_CATEGORIES.find(c => c.id === post.category) || { icon: '📝' };
            return `
            <div class="hgram-post-card post-type-${post.type.toLowerCase()}">
                <div class="hgram-post-header">
                    <div class="hgram-pfp">${post.authorPFP}</div>
                    <div class="hgram-author-info">
                        <strong>${post.author}</strong>
                        <small>@${post.authorHandle}</small>
                    </div>
                </div>
                <div class="hgram-post-image">
                     <span class="hgram-image-category-icon">${categoryInfo.icon}</span>
                     <p class="hgram-image-description-overlay">"${post.imageDescription}"</p>
                </div>
                <div class="hgram-post-caption">
                   <p><strong>@${post.authorHandle}</strong> ${post.caption.replace(/\n/g, '<br>')}</p>
                </div>
                 <div class="hgram-post-stats">
                    ${post.likes.toLocaleString()} likes • ${post.comments.toLocaleString()} comments
                </div>
                <div class="hgram-post-footer">
                    Posted at Age ${post.age}, Week ${post.week}
                </div>
            </div>
            `;
        }).join('');
    }

    return `
        <div class="hgram-profile-header">
            <div class="hgram-profile-pfp">
                ${generateAvatarSVG(gameState.player.appearance)}
            </div>
            <div class="hgram-profile-info">
                <h3>@${gameState.social.handle}</h3>
                <p>${gameState.player.name}</p>
            </div>
            <div class="hgram-profile-stats">
                <div><span>${gameState.career.completedRoles.length}</span><small>Projects</small></div>
                <div><span>${(gameState.social.followers/1000).toFixed(1)}K</span><small>Followers</small></div>
            </div>
        </div>
        <button class="create-post-button">Create a new post</button>
        <div class="hgram-feed">${feedHtml}</div>
    `;
}

function renderSocialDmsInboxView(): string {
    const sortedDms = [...gameState.social.dms].sort((a, b) => {
        const lastMsgA = a.messages[a.messages.length - 1]?.week || 0;
        const lastMsgB = b.messages[b.messages.length - 1]?.week || 0;
        return lastMsgB - lastMsgA;
    });

    if (sortedDms.length === 0) {
        return `<p class="no-content-message">Your inbox is empty. Interact with people on set to start conversations.</p>`;
    }
    
    return `
        <div class="dm-inbox-list">
            ${sortedDms.map(convo => {
                const npc = gameState.npcs.find(n => n.id === convo.npcId);
                if (!npc) return '';
                const lastMessage = convo.messages[convo.messages.length - 1];
                return `
                    <button class="dm-inbox-item ${!convo.isRead ? 'unread' : ''}" data-action="open-chat" data-npcid="${npc.id}">
                        <div class="hgram-pfp-small">👤</div>
                        <div class="dm-inbox-details">
                            <strong>${npc.name}</strong>
                            <p>${lastMessage.senderId === 'player' ? 'You: ' : ''}${lastMessage.text}</p>
                        </div>
                    </button>
                `;
            }).join('')}
        </div>
    `;
}

function renderSocialChatView(npcId: string): string {
    const convo = gameState.social.dms.find(c => c.npcId === npcId);
    const npc = gameState.npcs.find(n => n.id === npcId);

    if (!convo || !npc) return `<p>Conversation not found.</p><button class="back-button" data-action="back-to-dms">← Back to DMs</button>`;

    // Mark as read when opened and update global state
    if (!convo.isRead) {
        convo.isRead = true;
        gameState.social.hasUnreadDms = gameState.social.dms.some(c => !c.isRead);
    }
    
    return `
        <div class="chat-view-header">
            <button class="back-button" data-action="back-to-dms">←</button>
            <h4>${npc.name}</h4>
            <div></div> <!-- Spacer -->
        </div>
        <div class="chat-view-container">
            <div class="chat-messages-area">
                ${convo.messages.map(msg => `
                    <div class="chat-bubble-wrapper ${msg.senderId === 'player' ? 'player' : 'npc'}">
                        <div class="chat-bubble">${msg.text}</div>
                    </div>
                `).join('')}
                 <div id="typing-indicator" class="hidden">
                    <div class="chat-bubble-wrapper npc">
                        <div class="chat-bubble typing">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                 </div>
            </div>
            <div class="chat-input-area">
                <input type="text" id="dm-input" placeholder="Type a message..." autofocus>
                <button id="send-dm-btn" data-npcid="${npcId}">Send</button>
            </div>
        </div>
    `;
}


async function sendDm(npcId: string, messageText: string) {
    // 1. Find or create conversation
    let convo = gameState.social.dms.find(c => c.npcId === npcId);
    if (!convo) {
        convo = { npcId, messages: [], isRead: true };
        gameState.social.dms.push(convo);
    }

    // 2. Add player's message
    convo.messages.push({ senderId: 'player', week: gameState.week, text: messageText });
    
    // 3. Re-render UI to show player's message and typing indicator
    renderSocialView();
    (document.getElementById('dm-input') as HTMLInputElement)?.focus();
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) typingIndicator.classList.remove('hidden');

    // 4. Prepare prompt for AI
    const npc = gameState.npcs.find(n => n.id === npcId)!;
    const relationship = gameState.social.relationships.find(r => r.npcId === npcId)!;
    const conversationHistory = convo.messages.slice(-6).map(m => `${m.senderId === 'player' ? gameState.player.name : npc.name}: ${m.text}`).join('\n');
    
    const prompt = `
    You are an AI for an NPC in a Hollywood life simulator game.
    NPC Name: ${npc.name}
    NPC Personality: ${npc.personality}
    
    Player Name: ${gameState.player.name}
    Relationship with Player: ${relationship.status} (Score: ${relationship.relationshipScore}/100)
    
    Recent Conversation History:
    ${conversationHistory}
    
    Task: Write a short, in-character response from ${npc.name} to the last message from ${gameState.player.name}. Keep it concise, like a text message. Do not add quotation marks around the response.
    `;
    
    // 5. Call AI and add response
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const npcResponseText = response.text.trim().replace(/^"|"$/g, ''); // Remove quotes just in case
        convo.messages.push({ senderId: npcId, week: gameState.week, text: npcResponseText });
        
    } catch (error) {
        console.error("DM generation error:", error);
        convo.messages.push({ senderId: npcId, week: gameState.week, text: "..." }); // Generic response on error
    }

    // 6. Re-render UI with new message
    saveGame();
    renderSocialView();
    (document.getElementById('dm-input') as HTMLInputElement)?.focus();
}

/**
 * Renders the correct sub-view for the Social tab (HGram).
 */
function renderSocialView() {
    const view = document.getElementById('social-view');
    if (!view) return;

    if (!document.getElementById('hgram-content')) {
        view.innerHTML = `
            <div class="hgram-header">
                 <div class="hgram-profile-header-condensed">
                    <h3>HGram</h3>
                 </div>
                 <div class="hgram-header-actions">
                    <button class="hgram-action-btn" data-action="feed">Feed</button>
                    <button class="hgram-action-btn" data-action="dms">
                        DMs <span id="dm-notification-dot" class="notification-dot ${gameState.social.hasUnreadDms ? '' : 'hidden'}"></span>
                    </button>
                 </div>
            </div>
            <div id="hgram-content"></div>
        `;
    }

    const contentContainer = document.getElementById('hgram-content');
    const actionButtons = view.querySelectorAll('.hgram-action-btn');
    if (!contentContainer) return;

    actionButtons.forEach(btn => btn.classList.remove('active'));

    switch (activeSocialView) {
        case 'dms':
            contentContainer.innerHTML = renderSocialDmsInboxView();
            view.querySelector('[data-action="dms"]')?.classList.add('active');
            break;
        case 'chat':
            if (selectedConversationId) {
                contentContainer.innerHTML = renderSocialChatView(selectedConversationId);
                view.querySelector('[data-action="dms"]')?.classList.add('active');
            } else {
                activeSocialView = 'dms';
                renderSocialView();
            }
            break;
        case 'feed':
        default:
            contentContainer.innerHTML = renderSocialFeedView();
            view.querySelector('[data-action="feed"]')?.classList.add('active');
            break;
    }
    
    const dot = document.getElementById('dm-notification-dot');
    if (dot) {
        dot.className = `notification-dot ${gameState.social.hasUnreadDms ? '' : 'hidden'}`;
    }
}


function applyBackground(backgroundId: string) {
    const background = BACKGROUNDS.find(b => b.id === backgroundId);
    if (!background) return;

    // Reset stats to initial before applying background
    gameState.stats = JSON.parse(JSON.stringify(initialGameState.stats));
    gameState.wealth = JSON.parse(JSON.stringify(initialGameState.wealth));

    background.apply(gameState);
    gameState.player.background = background.id;
}

// --- CAREER FUNCTIONS ---
function generateCastAndCrew(audition: Audition): string[] {
    const crewIds: string[] = [];
    crewIds.push(audition.directorId);

    const numCoworkers = audition.role === 'Lead' ? 3 : (audition.role === 'Supporting' ? 2 : 1);
    const potentialCoworkers = gameState.npcs.filter(npc => npc.profession === 'Actor' && !crewIds.includes(npc.id));

    for (let i = 0; i < numCoworkers && potentialCoworkers.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * potentialCoworkers.length);
        const coworker = potentialCoworkers.splice(randomIndex, 1)[0];
        crewIds.push(coworker.id);
    }
    
    // Ensure relationships exist for all crew members
    crewIds.forEach(npcId => {
        if (!gameState.social.relationships.some(rel => rel.npcId === npcId)) {
            gameState.social.relationships.push({
                npcId: npcId,
                relationshipScore: Math.floor(Math.random() * 20), // 0-19
                status: 'Acquaintance',
                memory: [],
            });
        }
    });

    return crewIds;
}

/**
 * Generates a new list of available auditions for the week.
 */
function generateAuditions() {
    gameState.career.availableAuditions = [];
    const agentSkillBonus = gameState.career.agent ? AGENTS_FOR_HIRE.find(a => a.name === gameState.career.agent?.name)!.skill / 25 : 0;
    const fameBonus = gameState.stats.fame / 20;
    const numAuditions = Math.floor(2 + Math.random() * 3 + agentSkillBonus + fameBonus);

    const genres: Audition['genre'][] = ['Action', 'Comedy', 'Drama', 'Romance', 'Horror', 'Sci-Fi'];
    const projectTypes: Audition['projectType'][] = ['Film', 'TV Show', 'Commercial'];
    const roles: Audition['role'][] = ['Lead', 'Supporting', 'Minor', 'Extra'];
    const availableDirectors = gameState.npcs.filter(npc => npc.profession === 'Director');

    for (let i = 0; i < numAuditions; i++) {
        if (availableDirectors.length === 0) continue;

        const director = availableDirectors[Math.floor(Math.random() * availableDirectors.length)];
        const genre = genres[Math.floor(Math.random() * genres.length)];
        const projectType = projectTypes[Math.floor(Math.random() * projectTypes.length)];
        const title = `${PROJECT_ADJECTIVES[Math.floor(Math.random() * PROJECT_ADJECTIVES.length)]} ${PROJECT_NOUNS[Math.floor(Math.random() * PROJECT_NOUNS.length)]}`;
        
        const roleIndex = Math.max(0, 3 - Math.floor(gameState.stats.fame / 25 + Math.random() * 2));
        const role = roles[roleIndex];
        
        const basePay = (4 - roleIndex) * 200 + gameState.stats.fame * 10;
        const baseDifficulty = 10 + (3 - roleIndex) * 15 + gameState.age - 18;

        // Determine budget category based on fame
        let budgetCategory: BudgetCategory;
        if (gameState.stats.fame > 70) budgetCategory = 'Blockbuster';
        else if (gameState.stats.fame > 30) budgetCategory = 'Mid-Budget';
        else budgetCategory = 'Indie';
        
        // Determine backend points, more for lead roles and bigger budgets
        let backendPoints = 0;
        if (role === 'Lead' && projectType === 'Film') {
            if (budgetCategory === 'Blockbuster') backendPoints = 0.03 + Math.random() * 0.04; // 3-7%
            else if (budgetCategory === 'Mid-Budget') backendPoints = 0.01 + Math.random() * 0.02; // 1-3%
        }

        const audition: Audition = {
            id: `aud_${gameState.week}_${i}`,
            title,
            projectType,
            role,
            director: director.name,
            directorId: director.id,
            genre,
            weeklyPay: basePay + Math.floor(Math.random() * 100),
            famePotential: roleIndex < 2 ? 'High' : (roleIndex < 3 ? 'Medium' : 'Low'),
            difficulty: Math.floor(baseDifficulty + (Math.random() - 0.5) * 10),
            weeks: 4 + Math.floor(Math.random() * 8),
            description: `A promising ${budgetCategory} ${genre} ${projectType}.`,
            budgetCategory,
            backendPoints
        };
        gameState.career.availableAuditions.push(audition);
    }
}

function applyForAudition(auditionId: string) {
    if (gameState.career.appliedAuditions.includes(auditionId)) return;

    const audition = gameState.career.availableAuditions.find(a => a.id === auditionId);
    if (audition) {
        gameState.career.appliedAuditions.push(auditionId);
        addLog(`You applied for the role in "${audition.title}".`);
        showFeedback('✉️', 'Application sent!');
        renderCareerView();
    }
}

function showAgentSelectionModal() {
    modalIcon.innerHTML = '🤝';
    modalTitle.textContent = 'Find an Agent';
    modalText.innerHTML = 'A good agent can get you access to better roles, for a price.';
    
    const availableAgents = AGENTS_FOR_HIRE.filter(agent => gameState.stats.fame >= agent.hireThreshold);

    if (availableAgents.length === 0) {
        modalChoices.innerHTML = `<p>No agents are interested in representing you yet. Increase your fame.</p><button id="modal-close-btn">Close</button>`;
    } else {
        modalChoices.innerHTML = availableAgents.map((agent) => `
            <div class="agent-choice-card">
                <div class="agent-choice-header">
                    <h4>${agent.name}</h4>
                    <p>Commission: ${agent.commission * 100}%</p>
                </div>
                <p class="agent-choice-desc">${agent.description}</p>
                <button class="hire-agent-btn" data-name="${agent.name}">Hire ${agent.name.split(' ')[0]}</button>
            </div>
        `).join('') + `<button id="modal-close-btn" class="secondary-btn">Maybe Later</button>`;
    }

    modalBackdrop.classList.remove('hidden');

    modalBackdrop.querySelectorAll('.hire-agent-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const agentName = (e.currentTarget as HTMLButtonElement).dataset.name!;
            hireAgent(agentName);
        });
    });

    document.getElementById('modal-close-btn')?.addEventListener('click', () => {
        modalBackdrop.classList.add('hidden');
    });
}

function hireAgent(agentName: string) {
    const agentData = AGENTS_FOR_HIRE.find(a => a.name === agentName);
    if (agentData) {
        gameState.career.agent = {
            name: agentData.name,
            commission: agentData.commission,
            relationshipScore: 50,
        };
        addLog(`You hired ${agentData.name} as your new agent.`);
        showFeedback('🤝', `Hired ${agentData.name}!`);
        modalBackdrop.classList.add('hidden');
        renderCareerView();
        saveGame();
    }
}

function fireAgent() {
    if (gameState.career.agent) {
        addLog(`You fired your agent, ${gameState.career.agent.name}.`);
        showFeedback('👋', 'Agent fired.');
        gameState.career.agent = null;
        renderCareerView();
        saveGame();
    }
}

function renderCareerMainView(): string {
    let rolesHtml = '<h3>Current Roles</h3>';
    if (gameState.career.currentRoles.length === 0) {
        rolesHtml += '<p class="no-content-message">You are currently between projects.</p>';
    } else {
        rolesHtml += gameState.career.currentRoles.map((role, index) => `
            <div class="job-card">
                 <div class="job-card-header">
                    <span class="job-card-icon">🎬</span>
                    <div>
                        <h4>${role.title}</h4>
                        <small>as ${role.characterName} (${role.roleType})</small>
                    </div>
                </div>
                <div class="job-card-details">
                    <p>Weeks Left: ${role.weeksLeft} | Pay: $${role.weeklyPay.toLocaleString()}/week</p>
                </div>
                <div class="job-card-footer">
                    <button class="manage-role-btn" data-role-index="${index}">Manage Role</button>
                </div>
            </div>
        `).join('');
    }

    let agentHtml = '<h3>Agent</h3>';
    if (!gameState.career.agent) {
        agentHtml += `
            <div class="action-button-group">
                <p>You don't have an agent. An agent can find you better roles.</p>
                <button id="find-agent-btn">Find an Agent</button>
            </div>`;
    } else {
        agentHtml += `
            <div class="agent-info-card">
                <div class="agent-details">
                    <strong>${gameState.career.agent.name}</strong>
                    <small>Commission: ${gameState.career.agent.commission * 100}%</small>
                </div>
                <button id="fire-agent-btn" class="secondary-btn">Fire Agent</button>
            </div>
        `;
    }

    return `
        ${rolesHtml}
        ${agentHtml}
        <h3>Opportunities</h3>
        <div class="action-button-group">
            <p>Look for your next big break.</p>
            <button id="look-for-auditions-btn">Look for Auditions</button>
        </div>
    `;
}

function renderAuditionBoardView(): string {
    const { genre, pay, fame } = auditionFilters;

    const filteredAuditions = gameState.career.availableAuditions.filter(aud => {
        if (genre !== 'All' && aud.genre !== genre) return false;
        if (pay !== 'All') {
            const payThreshold = pay === 'Low' ? 500 : (pay === 'Medium' ? 2000 : 5000);
            if (pay === 'High+' && aud.weeklyPay < payThreshold) return false;
            if (pay === 'Medium' && (aud.weeklyPay < 500 || aud.weeklyPay >= 2000)) return false;
            if (pay === 'Low' && aud.weeklyPay >= 500) return false;
        }
        if (fame !== 'All' && aud.famePotential !== fame) return false;
        return true;
    });

    let listHtml = '';
    if (filteredAuditions.length === 0) {
        listHtml = '<p class="no-content-message">No auditions match your criteria. Check back next week!</p>';
    } else {
        listHtml = filteredAuditions.map(aud => {
            const isApplied = gameState.career.appliedAuditions.includes(aud.id);
            const backendPointsHtml = aud.backendPoints > 0 
                ? `<span class="detail-item"><span class="icon">📈</span> ${(aud.backendPoints * 100).toFixed(2)}% Points</span>` 
                : '';

            return `
            <div class="audition-card">
                <div class="audition-header">
                    <h3>${aud.title} <span class="project-type">${aud.genre} ${aud.projectType}</span></h3>
                    <p>Role: ${aud.role} (${aud.budgetCategory})</p>
                </div>
                <div class="audition-description">
                    <p>${aud.description}</p>
                </div>
                <div class="audition-details">
                    <span class="detail-item"><span class="icon">💰</span> $${aud.weeklyPay.toLocaleString()}/week</span>
                    <span class="detail-item"><span class="icon">⭐</span> ${aud.famePotential} Fame</span>
                    <span class="detail-item"><span class="icon">⌛</span> ${aud.weeks} Weeks</span>
                    <span class="detail-item"><span class="icon">🎯</span> Difficulty: ${aud.difficulty}</span>
                    ${backendPointsHtml}
                </div>
                <div class="audition-footer">
                    <button class="apply-audition-btn ${isApplied ? 'applied' : ''}" data-id="${aud.id}" ${isApplied ? 'disabled' : ''}>
                        ${isApplied ? 'Applied' : 'Apply'}
                    </button>
                </div>
            </div>
            `
        }).join('');
    }

    return `
        <div id="audition-filters">
            <label>Genre <select id="filter-genre" data-filter="genre">
                <option>All</option><option>Action</option><option>Comedy</option><option>Drama</option><option>Romance</option><option>Horror</option><option>Sci-Fi</option>
            </select></label>
            <label>Pay <select id="filter-pay" data-filter="pay">
                <option>All</option><option>Low</option><option>Medium</option><option>High+</option>
            </select></label>
            <label>Fame <select id="filter-fame" data-filter="fame">
                <option>All</option><option>Low</option><option>Medium</option><option>High</option>
            </select></label>
        </div>
        <div id="audition-list">${listHtml}</div>
    `;
}

function renderOnSetView(roleIndex: number): string {
    const role = gameState.career.currentRoles[roleIndex];
    if (!role) {
        activeCareerView = 'main';
        return renderCareerMainView();
    }
    const MAX_WEEKLY_ACTIONS = 6;
    const actionsDisabled = role.weeklyActionsTaken >= MAX_WEEKLY_ACTIONS ? 'disabled' : '';

    return `
        <div class="on-set-info-card">
            <div class="on-set-header">
                <h2>On Set: ${role.title}</h2>
                <p>as <strong>${role.characterName}</strong> (${role.roleType} Role)</p>
                <p><span>${role.weeksLeft}</span> weeks remaining</p>
            </div>
            <div class="on-set-progress-container">
                <div class="on-set-progress-bar-label">
                    <span>Project Popularity</span>
                    <span>${role.projectPopularity}%</span>
                </div>
                <div class="progress-bar-container">
                     <div class="progress-bar-inner" style="width: ${role.projectPopularity}%; background-color: var(--accent-color);"></div>
                </div>
            </div>
             <div class="on-set-progress-container">
                <div class="on-set-progress-bar-label">
                    <span>Your Performance</span>
                    <span>${role.performanceScore}%</span>
                </div>
                <div class="progress-bar-container">
                     <div class="progress-bar-inner" style="width: ${role.performanceScore}%; background-color: var(--success-color);"></div>
                </div>
            </div>
        </div>

        <h3 class="on-set-subheader">Weekly Actions</h3>
        <p class="on-set-subtext">${role.weeklyActionsTaken} / ${MAX_WEEKLY_ACTIONS} actions taken this week</p>

        <div class="on-set-actions-grid">
            <button class="on-set-action-btn" data-action="practice" ${actionsDisabled}>
                <span class="icon">🎭</span>
                <strong>Practice Lines</strong>
                <small>+Performance</small>
            </button>
            <button class="on-set-action-btn" data-action="develop" ${actionsDisabled}>
                 <span class="icon">🧠</span>
                <strong>Develop Character</strong>
                <small>++Performance</small>
            </button>
            <button class="on-set-action-btn" data-action="publicity" ${actionsDisabled}>
                 <span class="icon">📣</span>
                <strong>Publicity Stunt</strong>
                <small>+Popularity, Risky</small>
            </button>
            <button class="on-set-action-btn" data-action="viewCrew">
                 <span class="icon">👥</span>
                <strong>Cast & Crew</strong>
                <small>Build Relationships</small>
            </button>
        </div>

        <div class="on-set-bottom-actions">
             <button class="on-set-action-btn danger-button" data-action="quit">Quit Role</button>
        </div>
    `;
}

function performJobAction(roleIndex: number, action: string) {
    const role = gameState.career.currentRoles[roleIndex];
    if (!role || role.weeklyActionsTaken >= 6) return;

    switch (action) {
        case 'practice':
            role.performanceScore = Math.min(100, role.performanceScore + 5);
            role.weeklyActionsTaken++;
            showFeedback('🎭', 'Practice improves your performance.');
            addLog(`You rehearsed your lines for "${role.title}".`);
            break;
        case 'develop':
            role.performanceScore = Math.min(100, role.performanceScore + 8);
            gameState.stats.happiness = Math.max(0, gameState.stats.happiness - 3);
            role.weeklyActionsTaken++;
            showFeedback('🧠', 'Deep character work boosts performance.');
            addLog(`You spent time doing immersive prep for your role.`);
            break;
        case 'publicity':
            role.weeklyActionsTaken++;
            if (Math.random() > 0.25) { // 75% chance of success
                role.projectPopularity = Math.min(100, role.projectPopularity + 10);
                gameState.stats.fame += 1;
                showFeedback('📣', 'Publicity stunt was a success!');
                addLog(`A publicity stunt for "${role.title}" went well, boosting its popularity.`);
            } else {
                gameState.stats.reputation = Math.max(0, gameState.stats.reputation - 10);
                showFeedback('🔥', 'Publicity stunt backfired!');
                addLog(`Your publicity stunt was poorly received, hurting your reputation.`);
            }
            break;
    }
    renderCareerView();
}

function handleNpcInteractionChoice(roleIndex: number, npcId: string, outcome: any) {
    const relationship = gameState.social.relationships.find(r => r.npcId === npcId);
    if (!relationship) return;

    // Update relationship
    relationship.relationshipScore = Math.max(-100, Math.min(100, relationship.relationshipScore + outcome.relationshipChange));
    if (relationship.relationshipScore > 50) relationship.status = 'Friend';
    else if (relationship.relationshipScore < -50) relationship.status = 'Rival';
    else relationship.status = 'Acquaintance';

    // Update player stats
    if (outcome.playerStatChanges) {
        if (outcome.playerStatChanges.happiness) gameState.stats.happiness = Math.max(0, Math.min(100, gameState.stats.happiness + outcome.playerStatChanges.happiness));
        if (outcome.playerStatChanges.reputation) gameState.stats.reputation = Math.max(0, Math.min(100, gameState.stats.reputation + outcome.playerStatChanges.reputation));
        if (outcome.playerStatChanges.performanceScore) {
            const role = gameState.career.currentRoles[roleIndex];
            if (role) {
                role.performanceScore = Math.max(0, Math.min(100, role.performanceScore + outcome.playerStatChanges.performanceScore));
            }
        }
    }
    
    // Add to memory
    const memoryText = outcome.logMessage.replace(`You`, `${gameState.player.name}`); // Make it third person
    relationship.memory.unshift(memoryText);
    if (relationship.memory.length > 5) { // Keep memory short
        relationship.memory.pop();
    }


    addLog(outcome.logMessage);
    showFeedback('💬', outcome.relationshipChange > 0 ? 'Relationship improved' : 'Relationship worsened');
    
    modalBackdrop.classList.add('hidden');
    renderHeader();
    renderCareerView();
}


async function initiateNpcInteraction(roleIndex: number, npcId: string) {
    const role = gameState.career.currentRoles[roleIndex];
    const npc = gameState.npcs.find(n => n.id === npcId);
    const relationship = gameState.social.relationships.find(r => r.npcId === npcId);
    if (!role || !npc || !relationship) return;

    modalIcon.innerHTML = '💬';
    modalTitle.textContent = `Interacting with ${npc.name}...`;
    modalText.innerHTML = 'The AI is generating a scenario. Please wait.';
    modalChoices.innerHTML = '<div class="loading-spinner"></div>';
    modalBackdrop.classList.remove('hidden');

    const memoryContext = relationship.memory.length > 0
        ? `Relevant past interactions: [${relationship.memory.join('; ')}].`
        : "There is no significant history between them yet.";


    const prompt = `You are a game master for a Hollywood life simulator. The player, ${gameState.player.name}, is an actor. Generate a short, interactive, on-set scenario.

    Current Situation:
    - Player is working on a ${role.genre} ${role.projectType} called "${role.title}".
    - They are playing the ${role.roleType} role.
    - They are interacting with ${npc.name}, the ${npc.profession}.
    - ${npc.name}'s personality is "${npc.personality}".
    - The player's current relationship with them is ${relationship.relationshipScore} out of 100 (${relationship.status}).
    - ${memoryContext}

    Task:
    Create a scenario where the player interacts with ${npc.name}. Taking into account the NPC's personality and PAST INTERACTIONS, provide a scenario description and 2-3 distinct choices for the player. Each choice must lead to a logical outcome.

    Output Format (JSON only):
    {
      "scenario": "A description of the situation...",
      "choices": [
        {
          "text": "The first choice for the player.",
          "outcome": {
            "relationshipChange": 10,
            "logMessage": "A message for the game log describing what happened.",
            "playerStatChanges": { "happiness": 5, "reputation": 0, "performanceScore": 0 }
          }
        },
        {
          "text": "The second choice for the player.",
          "outcome": {
            "relationshipChange": -5,
            "logMessage": "...",
            "playerStatChanges": { "happiness": -2, "reputation": 0, "performanceScore": 0 }
          }
        }
      ]
    }`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        scenario: { type: Type.STRING },
                        choices: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    text: { type: Type.STRING },
                                    outcome: {
                                        type: Type.OBJECT,
                                        properties: {
                                            relationshipChange: { type: Type.NUMBER },
                                            logMessage: { type: Type.STRING },
                                            playerStatChanges: {
                                                type: Type.OBJECT,
                                                properties: {
                                                    happiness: { type: Type.NUMBER },
                                                    reputation: { type: Type.NUMBER },
                                                    performanceScore: { type: Type.NUMBER }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
            },
        });

        const interactionData = JSON.parse(response.text);

        modalIcon.innerHTML = '💬';
        modalTitle.textContent = `On set with ${npc.name}`;
        modalText.innerHTML = `<p class="interaction-scenario">"${interactionData.scenario}"</p>`;
        modalChoices.innerHTML = interactionData.choices.map((choice: any) => 
            `<button class="interaction-choice-btn" data-outcome='${JSON.stringify(choice.outcome)}'>${choice.text}</button>`
        ).join('') + `<button id="modal-close-btn" class="secondary-btn">Walk Away</button>`;
        
        document.getElementById('modal-close-btn')?.addEventListener('click', () => modalBackdrop.classList.add('hidden'));
        modalChoices.querySelectorAll('.interaction-choice-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const outcome = JSON.parse((e.currentTarget as HTMLButtonElement).dataset.outcome!);
                handleNpcInteractionChoice(roleIndex, npcId, outcome);
            });
        });

    } catch (error) {
        console.error("Error generating NPC interaction:", error);
        modalTitle.textContent = 'Error';
        modalText.innerHTML = 'There was an issue generating the scenario. Please try again.';
        modalChoices.innerHTML = `<button id="modal-close-btn">Close</button>`;
        document.getElementById('modal-close-btn')?.addEventListener('click', () => modalBackdrop.classList.add('hidden'));
    }
}


function showCastAndCrewModal(roleIndex: number) {
    const role = gameState.career.currentRoles[roleIndex];
    if (!role) return;

    modalIcon.innerHTML = '👥';
    modalTitle.textContent = 'Cast & Crew';
    modalText.innerHTML = `Interacting with your colleagues on "${role.title}".`;

    modalChoices.innerHTML = role.castAndCrew.map(npcId => {
        const npc = gameState.npcs.find(n => n.id === npcId);
        const relationship = gameState.social.relationships.find(r => r.npcId === npcId);
        if (!npc || !relationship) return '';

        const progress = (relationship.relationshipScore + 100) / 2;
        return `
        <div class="relationship-card">
            <div class="relationship-info">
                <strong>${npc.name}</strong>
                <small>${npc.profession} (${npc.personality})</small>
            </div>
            <div class="relationship-status">
                 <div class="progress-bar-container">
                    <div class="progress-bar-inner" style="width: ${progress}%;"></div>
                </div>
            </div>
            <button class="interact-crew-btn" data-npc-id="${npc.id}">Interact</button>
        </div>
        `
    }).join('') + `<button id="modal-close-btn" class="secondary-btn">Close</button>`;

    modalBackdrop.classList.remove('hidden');

    modalBackdrop.querySelectorAll('.interact-crew-btn').forEach(button => {
        button.addEventListener('click', e => {
            const npcId = (e.currentTarget as HTMLButtonElement).dataset.npcId!;
            initiateNpcInteraction(roleIndex, npcId);
        });
    });

    document.getElementById('modal-close-btn')?.addEventListener('click', () => {
        modalBackdrop.classList.add('hidden');
    });
}

function quitRole(roleIndex: number) {
    const role = gameState.career.currentRoles[roleIndex];
    if (!role) return;

    // Damage relationships with cast & crew
    role.castAndCrew.forEach(npcId => {
        const relationship = gameState.social.relationships.find(r => r.npcId === npcId);
        if (relationship) {
            relationship.relationshipScore = Math.max(-100, relationship.relationshipScore - 25);
            if (relationship.relationshipScore < -50) relationship.status = 'Rival';
            // Add memory of quitting
            relationship.memory.unshift(`Quit the project '${role.title}' abruptly.`);
            if (relationship.memory.length > 5) {
                relationship.memory.pop();
            }
        }
    });

    gameState.career.currentRoles.splice(roleIndex, 1);
    gameState.stats.reputation = Math.max(0, gameState.stats.reputation - 25);
    gameState.stats.happiness = Math.max(0, gameState.stats.happiness - 15);

    addLog(`You quit your role in "${role.title}", damaging your reputation and relationships on set.`);
    showFeedback('💥', 'You quit the project!');
    
    activeCareerView = 'main';
    selectedRoleForView = null;
    modalBackdrop.classList.add('hidden');
    renderCareerView();
    renderHeader();
    saveGame();
}

function renderCareerView() {
    const view = document.getElementById('career-view');
    if (!view) return;

    const backButtonHtml = activeCareerView !== 'main' ? `<button class="back-button" id="career-back-btn">← Back to Career Overview</button>` : '';
    let contentHtml = '';

    switch (activeCareerView) {
        case 'auditions':
            contentHtml = renderAuditionBoardView();
            break;
        case 'onSet':
             if (selectedRoleForView !== null) {
                contentHtml = renderOnSetView(selectedRoleForView);
            } else {
                activeCareerView = 'main';
                contentHtml = renderCareerMainView();
            }
            break;
        case 'main':
        default:
            contentHtml = renderCareerMainView();
            break;
    }

    view.innerHTML = `
        <h2>Career</h2>
        ${backButtonHtml}
        <div id="career-content-wrapper">${contentHtml}</div>
    `;
    
    // After rendering, ensure filters are set to the current state
     if (activeCareerView === 'auditions') {
        document.querySelectorAll<HTMLSelectElement>('#audition-filters select').forEach(select => {
            const filterKey = select.dataset.filter as keyof typeof auditionFilters;
            select.value = auditionFilters[filterKey];
        });
    }
}

// --- GAME LOOP ---

/**
 * Ends the game and shows a modal with the final results.
 * @param message - The reason for the game ending.
 */
function endGame(message: string) {
    gameState.isGameOver = true;
    advanceWeekBtn.disabled = true;
    advanceWeekBtn.textContent = 'Game Over';

    modalIcon.innerHTML = '💀';
    modalTitle.textContent = 'Career Over';
    modalText.innerHTML = `${message}<br><br>You survived ${gameState.week} weeks and reached the age of ${gameState.age}.`;
    modalChoices.innerHTML = `<button id="restart-game-btn">Start a New Life</button>`;
    modalBackdrop.classList.remove('hidden');

    const restartBtn = document.getElementById('restart-game-btn');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            localStorage.removeItem(STORAGE_KEY);
            window.location.reload();
        });
    }
}

function generateAwardNominations(year: number) {
    const nominees: { name: string; project: string; score: number; isPlayer: boolean; role: CompletedRole | null }[] = [];
    const eligibleRoles = gameState.career.completedRoles.filter(role =>
        role.weekCompleted > gameState.week - 52 &&
        role.roleType === 'Lead' &&
        role.projectType === 'Film'
    );

    if (eligibleRoles.length > 0) {
        eligibleRoles.forEach(role => {
            // Score based on performance, box office success relative to its scale, and player fame
            const performanceComponent = role.finalPerformanceScore;
            const boxOfficeComponent = (role.boxOfficeGross / 1000000) * 0.1; // 1 point per 10M
            const fameComponent = gameState.stats.fame * 0.2;
            const score = performanceComponent + boxOfficeComponent + fameComponent;
            nominees.push({ name: gameState.player.name, project: role.title, score: score, isPlayer: true, role: role });
        });
    }

    // Generate NPC nominees
    const topNpcs = [...gameState.npcs].filter(n => n.profession === 'Actor').sort((a, b) => b.fame - a.fame).slice(0, 10);
    for (let i = 0; i < 4; i++) {
        const npc = topNpcs[i % topNpcs.length];
        const score = (60 + Math.random() * 40) + (npc.fame * 0.3); // Base score + fame bonus
        nominees.push({
            name: npc.name,
            project: `${PROJECT_ADJECTIVES[Math.floor(Math.random() * PROJECT_ADJECTIVES.length)]} ${PROJECT_NOUNS[Math.floor(Math.random() * PROJECT_NOUNS.length)]}`,
            score: score,
            isPlayer: false,
            role: null,
        });
    }

    return {
        'Best Lead Performance': nominees.sort((a, b) => b.score - a.score).slice(0, 5)
    };
}

function showAwardCeremonyModal(nominations: any, year: number) {
    const category = 'Best Lead Performance';
    const nominees = nominations[category];
    const winner = nominees[0]; // Highest score wins

    const playerNomination = nominees.find((n: any) => n.isPlayer);
    const isPlayerWinner = winner.isPlayer;

    // Log all nominations and the win
    nominees.forEach((nom: any) => {
        if (nom.isPlayer) {
            gameState.career.awards.push({
                year,
                award: category,
                project: nom.project,
                won: nom.name === winner.name
            });
        }
    });

    // --- Modal Step 1: Announcement ---
    modalIcon.innerHTML = '🏆';
    modalTitle.textContent = `The ${year} Galaxy Awards`;
    modalText.innerHTML = `The most prestigious night in Hollywood is here! Let's see who takes home the gold.`;
    modalChoices.innerHTML = `<button id="modal-next-btn">View Nominees</button>`;
    modalBackdrop.classList.remove('hidden');

    const nextBtn = document.getElementById('modal-next-btn') as HTMLButtonElement;
    nextBtn.onclick = () => {
        // --- Modal Step 2: Show Nominees ---
        modalTitle.textContent = `Nominees for ${category}`;
        modalText.innerHTML = `The contenders for this year's top acting prize are:`;
        modalChoices.innerHTML = `
            <ul class="nominee-list">
                ${nominees.map((n: any) => `<li ${n.isPlayer ? 'class="player-nominee"' : ''}><strong>${n.name}</strong> for <em>${n.project}</em></li>`).join('')}
            </ul>
            <button id="modal-reveal-btn">And the winner is...</button>
        `;

        const revealBtn = document.getElementById('modal-reveal-btn') as HTMLButtonElement;
        revealBtn.onclick = () => {
            // --- Modal Step 3: Reveal Winner ---
            modalTitle.textContent = `And the Galaxy Award goes to...`;
            modalText.innerHTML = `<strong class="winner-announcement">${winner.name}</strong><br/>for their incredible performance in <em>${winner.project}</em>!`;
            
            if (isPlayerWinner) {
                gameState.stats.fame += 20;
                gameState.stats.reputation = Math.min(100, gameState.stats.reputation + 15);
                showFeedback('🏆', 'You won a Galaxy Award!');
                addLog(`You won the Galaxy Award for ${category}! Your fame and reputation soar.`);
            } else if (playerNomination) {
                 gameState.stats.reputation = Math.min(100, gameState.stats.reputation + 5);
                 showFeedback('✨', 'Nominated for a Galaxy Award!');
                 addLog(`You were nominated for a Galaxy Award, boosting your reputation.`);
            } else {
                 addLog(`You watched the Galaxy Awards from home this year.`);
            }

            modalChoices.innerHTML = `<button id="modal-close-btn">Close</button>`;
            document.getElementById('modal-close-btn')?.addEventListener('click', () => modalBackdrop.classList.add('hidden'));
            
            // Re-render relevant views after the ceremony concludes
            renderHeader();
            renderProfileView();
        };
    };
}

function triggerAwardCeremony(details: { year: number }) {
    addLog(`It's time for the ${details.year} Galaxy Awards!`);
    const nominations = generateAwardNominations(details.year);
    showAwardCeremonyModal(nominations, details.year);

    // Schedule the next one
    gameState.scheduledEvents.push({
        weeksLeft: 52,
        type: 'AWARD_CEREMONY',
        details: { year: details.year + 1 }
    });
}

async function processFirstDate(profile: DatingProfile) {
    addLog(`You went on your date with ${profile.name}.`);

    const prompt = `You are a story generator for a life simulator game.
    The player, ${gameState.player.name}, a movie star, went on a first date with ${profile.name}, a ${profile.age}-year-old ${profile.profession}.
    ${profile.name}'s bio is: "${profile.bio}".
    
    Based on this, how did the date go?
    1. Write a short, one-sentence summary of the date for the game's event log.
    2. Decide on a "chemistry score" from 0 to 100 representing how well it went.
    
    Provide a JSON object with two keys: "summary" (string) and "chemistry" (number).
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING },
                        chemistry: { type: Type.NUMBER }
                    },
                    required: ["summary", "chemistry"]
                }
            }
        });
        const result = JSON.parse(response.text);

        addLog(result.summary);

        if (result.chemistry > 65) {
            // Success!
            gameState.social.partner = {
                ...profile,
                relationshipScore: 50 + Math.floor((result.chemistry - 65) / 2),
                weeksTogether: 1,
                weeklyActionsTaken: 0,
            };
            gameState.social.status = 'Dating';
            gameState.stats.happiness = Math.min(100, gameState.stats.happiness + 15);
            showFeedback('😍', `It's a match! You're now dating ${profile.name}.`);
            addLog(`The date was a huge success! You and ${profile.name} are now dating.`);
        } else if (result.chemistry > 30) {
            // Neutral
            gameState.stats.happiness = Math.min(100, gameState.stats.happiness + 5);
            showFeedback('🤔', 'The date was just okay.');
            addLog(`The date with ${profile.name} was fine, but the spark wasn't really there.`);
        } else {
            // Bad date
            gameState.stats.happiness = Math.max(0, gameState.stats.happiness - 5);
            showFeedback('😬', 'That was an awkward date.');
            addLog(`The date with ${profile.name} was a bit of a disaster.`);
        }
    } catch (error) {
        console.error("Error processing first date:", error);
        addLog("The date was... memorable. For all the wrong reasons.");
    }
}

async function generateFanReviews(project: HStarDBProject): Promise<string[]> {
    try {
        const prompt = `You are a movie fan writing reviews on a social media site.
        Generate 3 distinct, short fan reviews for a movie with the following details:
        - Title: "${project.title}"
        - Genre: ${project.genre}
        - Outcome: ${project.boxOffice} (e.g., "Legendary Hit", "Solid Hit", "Box Office Bomb")

        The tone of the reviews should match the movie's outcome. For a hit, be enthusiastic. For a bomb, be critical or disappointed.

        Provide a JSON object with a single key "reviews" which is an array of 3 strings.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        reviews: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    },
                    required: ["reviews"]
                },
            },
        });

        const result = JSON.parse(response.text);
        return result.reviews || [];
    } catch (error) {
        console.error("Error generating fan reviews:", error);
        return ["Could not generate fan reviews at this time."];
    }
}

/**
 * Keeps the player's entry in the HStarDB in sync with the main game state.
 */
function updatePlayerHStarDBEntry() {
    let playerEntry = gameState.hstarDb.actors.find(a => a.id === 'player');
    if (!playerEntry) {
        playerEntry = {
            id: 'player',
            isPlayer: true,
            name: gameState.player.name,
            age: gameState.age,
            nationality: gameState.player.birthplace.split(', ')[1] || 'USA',
            popularityRating: gameState.stats.fame,
            filmography: [],
            awards: [],
            achievements: []
        };
        gameState.hstarDb.actors.push(playerEntry);
    }
    // Sync data
    playerEntry.name = gameState.player.name;
    playerEntry.age = gameState.age;
    playerEntry.popularityRating = gameState.stats.fame;
    playerEntry.awards = gameState.career.awards;
    playerEntry.achievements = gameState.player.achievements.map(achId => {
        const ach = ACHIEVEMENTS.find(a => a.id === achId);
        return { year: gameState.age, text: ach ? ach.name : 'Unknown' };
    });
    
    // Find project IDs for completed roles and sync filmography
    const projectIds = new Set(playerEntry.filmography);
    gameState.career.completedRoles.forEach(role => {
        const project = gameState.hstarDb.projects.find(p => p.title === role.title && p.year === role.year);
        if (project && !projectIds.has(project.id)) {
            projectIds.add(project.id);
        }
    });
    playerEntry.filmography = Array.from(projectIds);
}


/**
 * Advances the game by one week, updating all necessary state.
 */
async function advanceWeek() {
    if (gameState.isGameOver) return;
    saveGame(); // Autosave at the beginning of each week

    // 0. Handle Scheduled Events
    const dueEvents = gameState.scheduledEvents.filter(e => e.weeksLeft <= 1);
    for (const event of dueEvents) {
        switch (event.type) {
            case 'AWARD_CEREMONY':
                triggerAwardCeremony(event.details);
                break;
            case 'FIRST_DATE':
                await processFirstDate(event.details.profile);
                break;
        }
    }
    gameState.scheduledEvents = gameState.scheduledEvents.filter(e => e.weeksLeft > 1);
    gameState.scheduledEvents.forEach(e => e.weeksLeft--);


    // 1. Update Time
    gameState.week++;
    if ((gameState.week - 1) % 52 === 0 && gameState.week > 1) {
        gameState.age++;
        addLog(`🎂 Happy Birthday! You are now ${gameState.age}.`);
    }

    // 2. Process Career & Finances
    let totalIncomeThisWeek = 0;
    const rolesToFinish: { role: CurrentRole; index: number }[] = [];
    gameState.career.currentRoles.forEach((role, index) => {
        // Reset weekly actions at the start of the week
        role.weeklyActionsTaken = 0;
        
        // Relationship social effects
        role.castAndCrew.forEach(npcId => {
            const rel = gameState.social.relationships.find(r => r.npcId === npcId);
            if (rel?.status === 'Friend') gameState.stats.happiness = Math.min(100, gameState.stats.happiness + 1);
            if (rel?.status === 'Rival') gameState.stats.happiness = Math.max(0, gameState.stats.happiness - 1);
        });

        totalIncomeThisWeek += role.weeklyPay;
        role.weeksLeft--;
        if (role.weeksLeft <= 0) {
            rolesToFinish.push({ role, index });
        }
    });

    // Process finished roles outside the loop to avoid mutation issues
    for (const { role: finishedRole, index } of rolesToFinish.reverse()) {
        gameState.career.currentRoles.splice(index, 1);
        
        let fameGained = 0;
        let repGained = 0;
        let boxOfficeGross = 0;
        let playerCut = 0;
        let boxOfficeResult = "N/A";
        let budget = 0;
        const director = gameState.npcs.find(n => n.id === finishedRole.castAndCrew[0]);

        if (finishedRole.projectType === 'Film' || finishedRole.projectType === 'TV Show') {
            if (finishedRole.projectType === 'Film') {
                 switch(finishedRole.budgetCategory) {
                    case 'Indie': budget = 500000 + Math.random() * 4500000; break;
                    case 'Mid-Budget': budget = 10000000 + Math.random() * 65000000; break;
                    case 'Blockbuster': budget = 100000000 + Math.random() * 200000000; break;
                }

                const performanceFactor = finishedRole.performanceScore / 100;
                const popularityFactor = finishedRole.projectPopularity / 100;
                const fameFactor = gameState.stats.fame / 100;

                const combinedScore = (performanceFactor * 0.4) + (popularityFactor * 0.4) + (fameFactor * 0.2);
                const randomMultiplier = 0.5 + Math.random(); // 0.5 to 1.5
                const grossMultiplier = Math.max(0.1, combinedScore * 5 * randomMultiplier);

                boxOfficeGross = Math.round(budget * grossMultiplier);
                playerCut = Math.round(boxOfficeGross * finishedRole.backendPoints);
                
                gameState.wealth.cash += playerCut;

                const profitRatio = boxOfficeGross / budget;

                if (profitRatio > 5) {
                    boxOfficeResult = "Legendary Hit";
                    fameGained = 20 + Math.floor(Math.random() * 10);
                    repGained = 10;
                } else if (profitRatio > 3) {
                    boxOfficeResult = "Blockbuster Success";
                    fameGained = 15 + Math.floor(Math.random() * 5);
                    repGained = 5;
                } else if (profitRatio > 1.5) {
                    boxOfficeResult = "Solid Hit";
                    fameGained = 8 + Math.floor(Math.random() * 4);
                    repGained = 2;
                } else if (profitRatio > 0.8) {
                    boxOfficeResult = "Broke Even";
                    fameGained = 2 + Math.floor(Math.random() * 2);
                    repGained = 0;
                } else {
                    boxOfficeResult = "Box Office Bomb";
                    fameGained = 1;
                    repGained = -10;
                }
                addLog(`"${finishedRole.title}" was a ${boxOfficeResult}, grossing $${boxOfficeGross.toLocaleString()}.`);
                if (playerCut > 0) {
                     addLog(`Your backend deal earned you $${playerCut.toLocaleString()}!`);
                }
            } else { // TV Show, Commercials etc.
                boxOfficeResult = "N/A";
                fameGained = Math.round((finishedRole.projectPopularity / 10) + (finishedRole.performanceScore / 20));
                repGained = Math.round((finishedRole.performanceScore - 50) / 10);
                addLog(`You finished your role in "${finishedRole.title}"! You gained ${fameGained} fame.`);
            }
            
            // Create HStarDB entry for films and TV shows
            const newProjectEntry: HStarDBProject = {
                id: `proj_${gameState.week}_${Math.random()}`,
                title: finishedRole.title,
                year: gameState.age,
                genre: finishedRole.genre,
                director: director ? director.name : "N/A",
                cast: [
                    { actorId: 'player', characterName: finishedRole.characterName },
                    ...finishedRole.castAndCrew.slice(1).map(npcId => { // slice(1) to skip director
                        const npc = gameState.npcs.find(n => n.id === npcId);
                        return { actorId: npcId, characterName: npc ? 'Supporting' : 'Unknown' };
                    })
                ],
                boxOffice: boxOfficeResult,
                budget: budget,
                worldwideGross: boxOfficeGross,
                rating: parseFloat((5.0 + (finishedRole.performanceScore / 100) * 4.5).toFixed(1)),
                audienceRating: parseFloat((4.0 + (finishedRole.projectPopularity / 100) * 5.5).toFixed(1)),
                reviews: [],
                budgetCategory: finishedRole.budgetCategory,
                audienceReception: 'TBD'
            };

            const reviews = await generateFanReviews(newProjectEntry);
            newProjectEntry.reviews = reviews;
            gameState.hstarDb.projects.push(newProjectEntry);
        } else {
             addLog(`You finished your role in "${finishedRole.title}".`);
        }
        
        gameState.stats.fame += fameGained;
        gameState.stats.reputation = Math.max(0, Math.min(100, gameState.stats.reputation + repGained));

        const completed: CompletedRole = {
            title: finishedRole.title,
            characterName: finishedRole.characterName,
            year: gameState.age,
            weekCompleted: gameState.week,
            fameGained,
            reputationGained: repGained,
            genre: finishedRole.genre,
            director: director ? director.name : "N/A",
            cast: finishedRole.castAndCrew,
            boxOfficeGross,
            playerCut,
            boxOfficeResult,
            finalPerformanceScore: finishedRole.performanceScore,
            roleType: finishedRole.roleType,
        };
        gameState.career.completedRoles.push(completed);
        saveGame(); // Autosave after completing a role
         if (activeCareerView === 'onSet' && selectedRoleForView === index) {
            activeCareerView = 'main';
            selectedRoleForView = null;
        }
    }

    // 2b. Process Audition Results
    gameState.career.appliedAuditions.forEach(auditionId => {
        const audition = gameState.career.availableAuditions.find(a => a.id === auditionId);
        if (!audition) return;

        let successChance = (gameState.stats.actingSkill - audition.difficulty) + gameState.stats.fame / 2 + 50;
        if (Math.random() * 100 < successChance) {
            addLog(`🎉 You got the ${audition.role} role in "${audition.title}"!`);
            gameState.career.currentRoles.push({
                title: audition.title,
                characterName: 'TBD',
                roleType: audition.role,
                projectType: audition.projectType,
                genre: audition.genre,
                weeklyPay: audition.weeklyPay,
                weeksLeft: audition.weeks,
                initialWeeks: audition.weeks,
                projectPopularity: 30 + Math.floor(Math.random() * 20),
                performanceScore: 50,
                castAndCrew: generateCastAndCrew(audition),
                weeklyActionsTaken: 0,
                backendPoints: audition.backendPoints,
                budgetCategory: audition.budgetCategory,
            });
        } else {
            addLog(`You didn't get the role in "${audition.title}".`);
        }
    });
    gameState.career.appliedAuditions = [];

    // 2c. Agent takes a cut
    if (gameState.career.agent) {
        const commission = Math.round(totalIncomeThisWeek * gameState.career.agent.commission);
        totalIncomeThisWeek -= commission;
        addLog(`${gameState.career.agent.name} took a $${commission.toLocaleString()} commission.`);
    }

    // 2d. Update total income & expenses
    gameState.wealth.income = totalIncomeThisWeek;
    let totalExpensesThisWeek = BASE_EXPENSES;
    gameState.wealth.assets.forEach(asset => {
        totalExpensesThisWeek += asset.weeklyUpkeep;
    });
    gameState.wealth.expenses = totalExpensesThisWeek;
    gameState.wealth.cash += gameState.wealth.income - gameState.wealth.expenses;

    // 3. Update Stats
    gameState.stats.health = Math.max(0, gameState.stats.health - 1); // Aging
    if (!gameState.social.partner) { // Only lose happiness if single
        gameState.stats.happiness = Math.max(0, gameState.stats.happiness - 1); // Life is tough
    } else { // Handle relationship effects
        gameState.social.partner.weeklyActionsTaken = 0; // Reset weekly actions
        gameState.social.partner.weeksTogether++;
        // Relationship can improve or degrade over time slowly
        gameState.social.partner.relationshipScore += (Math.random() > 0.5 ? 1 : -1);
        gameState.social.partner.relationshipScore = Math.max(0, Math.min(100, gameState.social.partner.relationshipScore));
        
        if (gameState.social.partner.relationshipScore > 70) {
            gameState.stats.happiness = Math.min(100, gameState.stats.happiness + 3);
        } else if (gameState.social.partner.relationshipScore < 30) {
            gameState.stats.happiness = Math.max(0, gameState.stats.happiness - 3);
        }
    }

    // 4. Update History for Charts
    gameState.stats.history.week.push(gameState.week);
    gameState.stats.history.fame.push(gameState.stats.fame);
    gameState.stats.history.actingSkill.push(gameState.stats.actingSkill);
    gameState.stats.history.happiness.push(gameState.stats.happiness);
    gameState.stats.history.health.push(gameState.stats.health);
    gameState.stats.history.reputation.push(gameState.stats.reputation);
    gameState.wealth.history.week.push(gameState.week);
    gameState.wealth.history.cash.push(gameState.wealth.cash);

    // 5. --- NPC Progression Simulation ---
    const npcsToProcess = 5; // Process a few NPCs each week to avoid lag
    for (let i = 0; i < npcsToProcess; i++) {
        const npcIndex = (gameState.week + i) % gameState.npcs.length;
        const npc = gameState.npcs[npcIndex];
        if (!npc || npc.profession !== 'Actor') continue;

        if (npc.currentProjectWeeksLeft > 0) {
            npc.currentProjectWeeksLeft--;
            if (npc.currentProjectWeeksLeft === 0) {
                // Project finished
                const fameGain = 2 + Math.floor(Math.random() * 5);
                npc.fame = Math.min(100, npc.fame + fameGain);
                 const hstarNpc = gameState.hstarDb.actors.find(a => a.id === npc.id);
                 if(hstarNpc) hstarNpc.popularityRating = npc.fame;
            }
        } else {
            // Chance to get a new project
            const chance = npc.fame / 4 + npc.actingSkill / 4; // Max 50% chance per week
            if (Math.random() * 100 < chance) {
                npc.currentProjectWeeksLeft = 6 + Math.floor(Math.random() * 10);
                const projectTitle = `${PROJECT_ADJECTIVES[Math.floor(Math.random() * PROJECT_ADJECTIVES.length)]} ${PROJECT_NOUNS[Math.floor(Math.random() * PROJECT_NOUNS.length)]}`;
                
                 // Create a simplified project for their filmography
                const director = gameState.npcs.find(n => n.profession === 'Director' && n.id !== npc.id);
                const newNpcProject: HStarDBProject = {
                    id: `proj_npc_${gameState.week}_${npc.id}`,
                    title: projectTitle,
                    year: gameState.age,
                    genre: ['Action', 'Comedy', 'Drama', 'Romance', 'Horror', 'Sci-Fi'][Math.floor(Math.random() * 6)] as any,
                    director: director ? director.name : "Unknown",
                    cast: [{actorId: npc.id, characterName: 'Lead'}],
                    boxOffice: "Moderate Success",
                    budget: 20000000,
                    worldwideGross: 100000000,
                    rating: 6.0 + Math.random() * 3,
                    audienceRating: 6.0 + Math.random() * 3,
                    reviews: ["A solid performance by the cast."],
                    budgetCategory: "Mid-Budget",
                    audienceReception: "Well-Received"
                };
                gameState.hstarDb.projects.push(newNpcProject);

                // Update the NPC's filmography in HStarDB
                const hstarNpc = gameState.hstarDb.actors.find(a => a.id === npc.id);
                if (hstarNpc) {
                    hstarNpc.filmography.push(newNpcProject.id);
                }

                if (Math.random() < 0.25) {
                    const newsPost: Post = {
                        id: `post_news_${gameState.week}_${npc.id}`,
                        week: gameState.week, age: gameState.age,
                        author: 'Casting Weekly', authorHandle: 'castingweekly', authorPFP: '📢',
                        type: 'News', category: 'Promo',
                        imageDescription: `A headshot of actor ${npc.name}.`,
                        caption: `BREAKING: ${npc.name} has been cast in the upcoming film "${projectTitle}". A huge get for the rising star! #casting #newmovie #hollywoodascent`,
                        likes: Math.floor(Math.random() * 10000), comments: Math.floor(Math.random() * 800), shares: Math.floor(Math.random() * 200)
                    };
                    gameState.social.feed.unshift(newsPost);
                }
            }
        }
    }

    // 5a. --- Social Simulation (Proactive DMs) ---
    for (const rel of gameState.social.relationships) {
        if (rel.status === 'Acquaintance' || Math.random() > 0.05) continue; 
        
        const npc = gameState.npcs.find(n => n.id === rel.npcId);
        if (!npc) continue;

        const existingConvo = gameState.social.dms.find(c => c.npcId === npc.id);
        if (existingConvo && !existingConvo.isRead) continue;

        let promptContext = `The player, ${gameState.player.name}, recently finished the project "${gameState.career.completedRoles.slice(-1)[0]?.title}".`;
        if (Math.random() > 0.5) {
            promptContext = `It's a normal week in Hollywood.`;
        }

        const prompt = `
        You are an AI for an NPC in a Hollywood life simulator game.
        NPC Name: ${npc.name}
        NPC Personality: ${npc.personality}
        
        Player Name: ${gameState.player.name}
        Relationship with Player: ${rel.status} (Score: ${rel.relationshipScore}/100)
        
        Context: ${promptContext}

        Task: Write a short, in-character message from ${npc.name} to ${gameState.player.name}, initiating a conversation. It could be about work, gossip, or just checking in. Keep it concise, like a text message. Do not add quotation marks around the response.
        `;
        
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
            });
            const messageText = response.text.trim().replace(/^"|"$/g, '');
            
            let convo = gameState.social.dms.find(c => c.npcId === npc.id);
            if (!convo) {
                convo = { npcId: npc.id, messages: [], isRead: false };
                gameState.social.dms.push(convo);
            }
            
            convo.messages.push({ senderId: npc.id, week: gameState.week, text: messageText });
            convo.isRead = false;
            gameState.social.hasUnreadDms = true;
            
        } catch (error) {
            console.error("Proactive DM generation error:", error);
        }
    }
    
    // 5b. Update player entry in HStarDB
    updatePlayerHStarDBEntry();

    // 6. Check Achievements
    checkAndGrantAchievements();

    // 7. Check for Game Over
    if (gameState.stats.health <= 0) {
        endGame("Your health ran out.");
        return;
    }
    if (gameState.wealth.cash < -5000) { // Debt threshold
        endGame("You went bankrupt.");
        return;
    }

    // 8. Generate new opportunities
    generateAuditions();

    // 9. Re-render UI
    renderHeader();
    renderDashboard();
    // Re-render active view if it needs updates
    const activeView = document.querySelector('.view.active');
    if (activeView) {
        switchView(activeView.id);
    }
}


function populateNpcPool() {
    const usedNames = new Set<string>();
    const npcs: NPC[] = [];
    let idCounter = 0;

    while (npcs.length < 50 && usedNames.size < NPC_NAMES.length) {
        const name = NPC_NAMES[Math.floor(Math.random() * NPC_NAMES.length)];
        if (usedNames.has(name)) continue;
        usedNames.add(name);

        npcs.push({
            id: `npc_${idCounter++}`,
            name,
            profession: Math.random() > 0.3 ? 'Actor' : 'Director',
            personality: PERSONALITY_TRAITS[Math.floor(Math.random() * PERSONALITY_TRAITS.length)],
            fame: 10 + Math.floor(Math.random() * 70),
            actingSkill: 10 + Math.floor(Math.random() * 60),
            currentProjectWeeksLeft: 0,
        });
    }
    gameState.npcs = npcs;
}


function populateInitialHStarDB() {
    // Sync NPCs to HStarDB actors list
    gameState.hstarDb.actors = gameState.npcs
        .filter(npc => npc.profession === 'Actor')
        .map(npc => ({
            id: npc.id, name: npc.name, isPlayer: false, age: 25 + Math.floor(Math.random() * 20),
            nationality: 'USA', popularityRating: npc.fame, filmography: [], awards: [], achievements: []
    }));
    
    // Add player entry
    updatePlayerHStarDBEntry();

    const projectTitles = ["Midnight Echo", "Crimson Legacy", "Starlight Gambit", "Forgotten Voyage"];
    projectTitles.forEach((title, i) => {
        const director = gameState.npcs.find(n => n.profession === 'Director');
        gameState.hstarDb.projects.push({
            id: `proj_${i}`, title: title, year: gameState.age - 2, genre: 'Drama',
            director: director ? director.name : "N/A", 
            cast: [], boxOffice: 'Moderate Success', budget: 50000000,
            worldwideGross: 150000000, rating: 7.5 + i, audienceRating: 8.0 + i, reviews: [],
            budgetCategory: 'Mid-Budget', audienceReception: 'Well-Received'
        });
    });
}

// --- INITIALIZATION ---
function switchView(viewId: string) {
    views.forEach(v => v.classList.remove('active'));
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.add('active');
    }

    // Call render functions for views that need dynamic content
    if (viewId === 'profile-view') renderProfileView();
    if (viewId === 'social-view') renderSocialView();
    if (viewId === 'career-view') renderCareerView();
    if (viewId === 'activities-view') renderActivitiesView();
    if (viewId === 'wealth-view') renderWealthView();
    if (viewId === 'relationships-view') renderRelationshipsView();
    if (viewId === 'hstardb-view') renderHStarDBView();
}


function init() {
    const gameLoaded = loadGame();

    // Hide creation, show game
    (document.getElementById('creation-screen') as HTMLElement).style.display = 'none';
    (document.getElementById('game-container') as HTMLElement).style.display = 'flex';

    // Setup Navigation and other event listeners (common for new & loaded games)
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const viewId = button.dataset.view!;
            switchView(viewId);
        });
    });
    advanceWeekBtn.addEventListener('click', advanceWeek);
    
    // Delegated event listener for Career View
    const careerView = document.getElementById('career-view') as HTMLElement;
    careerView.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const button = target.closest('button');
        if (!button) return;

        if (button.id === 'find-agent-btn') {
            showAgentSelectionModal();
        } else if (button.id === 'look-for-auditions-btn') {
            activeCareerView = 'auditions';
            renderCareerView();
        } else if (button.id === 'fire-agent-btn') {
            fireAgent();
        } else if (button.id === 'career-back-btn') {
            activeCareerView = 'main';
            selectedRoleForView = null;
            renderCareerView();
        } else if (button.matches('.apply-audition-btn')) {
            const auditionId = button.dataset.id;
            if (auditionId) {
                applyForAudition(auditionId);
            }
        } else if (button.matches('.manage-role-btn')) {
            const roleIndex = parseInt(button.dataset.roleIndex!, 10);
            activeCareerView = 'onSet';
            selectedRoleForView = roleIndex;
            renderCareerView();
        } else if (button.matches('.on-set-action-btn')) {
            const action = button.dataset.action;
            if (action && selectedRoleForView !== null) {
                if (action === 'quit') {
                    quitRole(selectedRoleForView);
                } else if (action === 'viewCrew') {
                    showCastAndCrewModal(selectedRoleForView);
                } else {
                    performJobAction(selectedRoleForView, action);
                }
            }
        }
    });
    
    // Delegated listener for audition filters
    careerView.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement;
        if (target.matches('#audition-filters select')) {
            const filterKey = target.dataset.filter as keyof typeof auditionFilters;
            if (filterKey) {
                auditionFilters[filterKey] = target.value;
                renderCareerView();
            }
        }
    });

    // Delegated listener for Social View
    const socialView = document.getElementById('social-view') as HTMLElement;
    socialView.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const button = target.closest('button');
        if (!button) return;

        if (button.matches('.create-post-button')) {
            showCreatePostModal();
        } else if (button.matches('.hgram-action-btn')) {
            const action = button.dataset.action as 'feed' | 'dms';
            if (action) {
                activeSocialView = action;
                selectedConversationId = null;
                renderSocialView();
            }
        } else if (button.matches('.dm-inbox-item')) {
            const npcId = button.dataset.npcid;
            if (npcId) {
                activeSocialView = 'chat';
                selectedConversationId = npcId;
                renderSocialView();
            }
        } else if (button.id === 'send-dm-btn') {
            const input = document.getElementById('dm-input') as HTMLInputElement;
            const npcId = button.dataset.npcid;
            if (input && npcId && input.value.trim()) {
                sendDm(npcId, input.value.trim());
                input.value = ''; // Clear input after sending
            }
        } else if (button.dataset.action === 'back-to-dms') {
            activeSocialView = 'dms';
            selectedConversationId = null;
            renderSocialView();
        }
    });
    
    // Delegated listener for Wealth View
    const wealthView = document.getElementById('wealth-view') as HTMLElement;
    wealthView.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const button = target.closest('button');
        if (!button) return;

        // Handle tab switching
        if (button.parentElement?.classList.contains('wealth-nav')) {
            wealthViewState = button.dataset.tab as 'overview' | 'shop' | 'assets';
            renderWealthView();
            return;
        }

        // Handle shop category switching
        if (button.parentElement?.classList.contains('shop-category-nav')) {
            activeShopCategory = button.dataset.category as 'Real Estate' | 'Vehicles' | 'Luxury Goods';
            renderWealthView();
            return;
        }

        // Handle item purchase
        if (button.matches('.item-buy-btn')) {
            const itemId = button.dataset.id;
            if (itemId) {
                buyShopItem(itemId);
            }
        }
    });

    // Delegated listener for Profile View (Name Change)
    const profileView = document.getElementById('profile-view') as HTMLElement;
    profileView.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const button = target.closest('button');
        if (!button) return;
        
        const displayContainer = document.getElementById('player-name-display-container');
        const inputContainer = document.getElementById('player-name-input-container');

        if (button.id === 'edit-name-btn') {
            displayContainer?.classList.add('hidden');
            inputContainer?.classList.remove('hidden');
            (document.getElementById('player-name-input') as HTMLInputElement)?.focus();
        } else if (button.id === 'cancel-name-btn') {
            displayContainer?.classList.remove('hidden');
            inputContainer?.classList.add('hidden');
        } else if (button.id === 'save-name-btn') {
            const newName = (document.getElementById('player-name-input') as HTMLInputElement).value.trim();
            if (newName && newName.length > 0 && newName.length <= 20) {
                gameState.player.name = newName;
                // Optionally update handle too
                gameState.social.handle = newName.toLowerCase().replace(/\s+/g, '_').slice(0, 15);
                showFeedback('✅', 'Name updated!');
                addLog(`You are now known as ${newName}.`);
                saveGame();
                renderHeader();
                renderProfileView(); // This will also switch back to display mode
            } else {
                showFeedback('⚠️', 'Name must be between 1 and 20 characters.');
            }
        }
    });

    // Delegated listener for HStarDB View
    const hstarDbView = document.getElementById('hstardb-view') as HTMLElement;
    hstarDbView.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const button = target.closest('button, tr') as HTMLElement | null;
        if (!button) return;

        if (button.classList.contains('hstardb-back-btn')) {
            hstarDbViewState.view = 'main';
            hstarDbViewState.selectedId = null;
            renderHStarDBView();
        } else if (button.classList.contains('ranking-item') || button.classList.contains('cast-member')) {
            const id = button.dataset.id;
            const type = button.dataset.type as 'project' | 'actor' | undefined;
            if (id && type) {
                hstarDbViewState.view = type;
                hstarDbViewState.selectedId = id;
                renderHStarDBView();
            }
        }
    });

    // Delegated listener for Relationships View
    const relationshipsView = document.getElementById('relationships-view') as HTMLElement;
    relationshipsView.addEventListener('click', e => {
        const target = e.target as HTMLElement;
        const button = target.closest('button');
        if (!button) return;
        
        // Tab switching
        if (button.parentElement?.classList.contains('relationships-nav')) {
            activeRelationshipView = button.dataset.tab as 'colleagues' | 'dating';
            renderRelationshipsView();
            return;
        }
        
        // Dating actions
        if (button.parentElement?.classList.contains('dating-preference-selector')) {
            gameState.player.datingPreference = button.dataset.pref as 'Male' | 'Female' | 'Everyone';
            renderRelationshipsView();
            return;
        }

        if (button.id === 'generate-matches-btn') {
            generateDatingProfiles(false);
        } else if (button.id === 'refresh-matches-btn') {
            generateDatingProfiles(true);
        } else if (button.matches('.go-on-date-btn')) {
            goOnDate(button.dataset.id!);
        } else if (button.id === 'break-up-btn') {
            breakUp();
        } else if (button.matches('.partner-activity-btn')) {
            performPartnerActivity(button.dataset.action!);
        }
    });


    if (gameLoaded) {
        showFeedback('✅', 'Game progress loaded.');
        updatePlayerHStarDBEntry(); // Ensure player exists in DB on load
    } else {
        // This is a new game
        // Create a random character
        gameState.player.name = `Starry ${Math.floor(Math.random() * 900) + 100}`;
        gameState.social.handle = gameState.player.name.toLowerCase().replace(' ', '_');
        gameState.player.gender = GENDERS[Math.floor(Math.random() * GENDERS.length)];
        gameState.player.birthplace = BIRTHPLACES[Math.floor(Math.random() * BIRTHPLACES.length)];
        // Randomize appearance
        gameState.player.appearance.hairColor = HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)];
        gameState.player.appearance.skinTone = SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)];
        gameState.player.appearance.clothingColor = CLOTHING_COLORS[Math.floor(Math.random() * CLOTHING_COLORS.length)];
        const randomHair = HAIRSTYLES[Math.floor(Math.random() * HAIRSTYLES.length)];
        gameState.player.hairstyle = randomHair.name;
        gameState.player.appearance.hairstylePath = randomHair.path;

        // Apply random background
        const randomBg = BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)];
        applyBackground(randomBg.id);

        // Start with more cash
        gameState.wealth.cash = 100000;

        addLog(`Welcome to Hollywood, ${gameState.player.name}! You start your career with a dream and $100,000.`);

        // Populate the world
        populateNpcPool();
        populateInitialHStarDB();
        generateAuditions(); // Generate first week of auditions

        // Schedule first award ceremony
        gameState.scheduledEvents.push({
            weeksLeft: 52,
            type: 'AWARD_CEREMONY',
            details: { year: gameState.age }
        });
        saveGame(); // The first save
    }

    // Initial Render
    renderHeader();
    renderDashboard();
}


// Start the game
init();