
import { fetchTasksByDate } from './lib/repositories/tasksRepo';
import { getMenteeIdFromStorage } from './lib/utils/menteeSession';

// Mock getMenteeIdFromStorage since we are running in node environment without localStorage
// We need to fetch a real menteeId from DB or use a known test ID
// For now, let's try to list tasks for a known date if we can get a mentee ID.
// Since we can't easily access localStorage in this script, we'll need to manually provide a menteeId or fetch one.

async function verify() {
    console.log("Verifying fetchTasksByDate...");

    // Hardcode a menteeId for testing if needed, or fetch from users table
    // For safety, let's just check if the function exists and runs without error with a dummy ID
    try {
        const dummyId = "test-mentee-id";
        const date = new Date();
        console.log(`Fetching tasks for mentee ${dummyId} on ${date.toISOString()}`);
        const tasks = await fetchTasksByDate({ menteeId: dummyId, date });
        console.log("Tasks fetched:", tasks);
    } catch (e) {
        console.error("Error fetching tasks:", e);
    }
}

verify();
