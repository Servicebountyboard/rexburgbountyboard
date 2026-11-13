import { activityFixtures, bounties, conversations, myBountyFixtures, profileFixture, reviewFixtures, serviceTags } from "./fixtures";

/** UI data boundary. Replace these methods with feature services when backend work begins. */
export const previewRepository = {
  listBounties: () => bounties,
  listServiceTags: () => serviceTags,
  listConversations: () => conversations,
  getProfile: () => profileFixture,
  listMyBounties: () => myBountyFixtures,
  listReviews: () => reviewFixtures,
  listActivity: () => activityFixtures,
};
