export interface PostnatalTip {
  min_weeks: number;
  max_weeks: number;
  body: string;
  self_care: string;
}

export const POSTNATAL_WEEKLY_TIPS: PostnatalTip[] = [
  // ── Newborn (0-4 weeks) ──
  { min_weeks: 0, max_weeks: 2, body: "Your baby is adjusting to life outside the womb. Expect lots of sleeping (16-17 hours a day), feeding every 2-3 hours, and plenty of diaper changes. Skin-to-skin contact helps regulate their temperature and builds your bond.", self_care: "Your body is healing. Rest when the baby rests, accept help from others, and stay hydrated. It's okay to feel a swirl of emotions — the baby blues are common in the first two weeks." },
  { min_weeks: 3, max_weeks: 4, body: "Your baby may be more alert during wake windows now. They're starting to focus on faces and may show early signs of a social smile. Tummy time (supervised, short sessions) helps build neck strength.", self_care: "If you're feeling persistently sad, anxious, or overwhelmed beyond week 2, talk to your doctor. Postpartum mood disorders are treatable and nothing to be ashamed of." },

  // ── 1-2 months (5-12 weeks) ──
  { min_weeks: 5, max_weeks: 8, body: "Feeding patterns may become slightly more predictable. Your baby is growing fast — expect a growth spurt around 6 weeks with increased fussiness and feeding. Those first real smiles should be appearing!", self_care: "Try to get outside for a short walk when you can — fresh air and gentle movement benefit both of you. You don't need to 'bounce back' — focus on nourishing yourself." },
  { min_weeks: 9, max_weeks: 12, body: "Your baby is becoming more interactive — cooing, gurgling, and tracking objects with their eyes. They may start sleeping slightly longer stretches at night. Every baby is different, so try not to compare.", self_care: "Consider establishing a simple self-care routine: a warm drink in the morning, a few minutes of stretching, or connecting with a friend. Small moments matter." },

  // ── 3-4 months (13-20 weeks) ──
  { min_weeks: 13, max_weeks: 16, body: "Your baby is discovering their hands and may start batting at toys. Laughter may emerge! The 4-month sleep regression is common — hang in there. This is a great time to start a simple bedtime routine.", self_care: "If you're returning to work, give yourself grace during the transition. It's normal to feel conflicted. If you're home, know that caring for a baby IS work." },
  { min_weeks: 17, max_weeks: 20, body: "Baby is getting stronger — pushing up during tummy time, maybe starting to roll. They're fascinated by everything around them. Reading aloud, singing, and narrating your day all support language development.", self_care: "Check in with your own sleep. Even imperfect sleep hygiene (consistent bedtime, dark room) can help. Tag-team with a partner or support person when possible." },

  // ── 5-6 months (21-30 weeks) ──
  { min_weeks: 21, max_weeks: 26, body: "Your baby may be ready to start solid foods around 6 months — look for signs of readiness like sitting with support and showing interest in your food. Continue breastmilk or formula as their primary nutrition.", self_care: "Introducing solids is messy and fun. Don't stress about how much they eat — it's about exploration at first. Take a breath and enjoy the faces they make!" },
  { min_weeks: 27, max_weeks: 30, body: "Baby is likely sitting with support or independently. They're developing object permanence — peek-a-boo becomes hilarious! Separation anxiety may start to emerge as they understand you can leave.", self_care: "Reconnect with something that makes you feel like yourself — a hobby, a podcast, a meal with a friend. You're more than just a parent, and that matters." },

  // ── 7-9 months (31-43 weeks) ──
  { min_weeks: 31, max_weeks: 35, body: "Mobility is increasing — crawling, scooting, or creeping may begin. Time to baby-proof if you haven't already! Your baby is developing preferences and may have a favorite toy or comfort object.", self_care: "As your baby becomes more mobile, you might feel like you can't look away for a second. Create safe zones in your home so you can breathe." },
  { min_weeks: 36, max_weeks: 43, body: "Your baby may be pulling up to stand, cruising along furniture, and using a pincer grasp to pick up small foods. Clapping, waving bye-bye, and understanding simple words like 'no' emerge around this time.", self_care: "The days are long but the months are short. Take a moment to notice something you're proud of — in your baby and in yourself as a parent." },

  // ── 10-12 months (44-56 weeks) ──
  { min_weeks: 44, max_weeks: 52, body: "First words, first steps, first birthday approaching! Your baby is becoming a toddler. They understand much more than they can say. Keep talking, reading, and singing to build their language foundation.", self_care: "Planning a first birthday? Keep it simple — the party is really for you and your community. You survived the first year!" },

  // ── 12-18 months (53-78 weeks) ──
  { min_weeks: 53, max_weeks: 65, body: "Walking is becoming more confident. Toddlers this age love to explore, empty containers, and put things in and out of boxes. They're also testing boundaries — this is normal development, not defiance.", self_care: "Tantrums may start emerging. Take a deep breath. Your calm presence helps their developing brain learn to regulate. It's okay to step away for a moment if you need to." },
  { min_weeks: 66, max_weeks: 78, body: "Vocabulary is growing rapidly. Your toddler may use 10-50 words and understands even more. They're developing a sense of self and opinions — 'no' and 'mine' become favorite words.", self_care: "Connect with other parents if you can. Sharing the triumphs and struggles of toddlerhood helps everyone feel less alone." },

  // ── 18-24 months (79-104 weeks) ──
  { min_weeks: 79, max_weeks: 91, body: "Two-word phrases are emerging: 'more milk', 'big truck'. Your toddler loves parallel play alongside other children. They're also developing empathy — noticing when someone is sad or hurt.", self_care: "It's okay to feel touched-out. Build in moments of physical space for yourself, even if it's just five minutes with the door closed." },
  { min_weeks: 92, max_weeks: 104, body: "Your toddler is becoming increasingly independent — wanting to do things 'by myself'. Let them try (within safe limits). Self-feeding, simple dressing, and helping with tasks build confidence.", self_care: "The second year is often harder than the first in different ways. If you're struggling, it's not a failure — it's a sign you need support. Reach out." },

  // ── 2-3 years (105-156 weeks) ──
  { min_weeks: 105, max_weeks: 130, body: "Imagination is blooming — pretend play, stories, and creativity are thriving. Your child is learning to manage big emotions (sometimes unsuccessfully). Consistent, loving boundaries help them feel secure.", self_care: "Model the emotional regulation you want to see. Name your own feelings: 'I feel frustrated when...' Children learn by watching you." },
  { min_weeks: 131, max_weeks: 156, body: "Potty training readiness may emerge — look for interest in the toilet, staying dry for longer periods, and being able to follow simple instructions. Don't rush it; readiness varies widely.", self_care: "Comparing your child to others is tempting but rarely helpful. Every child develops at their own pace. Focus on your child's unique strengths." },

  // ── 3-4 years (157-208 weeks) ──
  { min_weeks: 157, max_weeks: 182, body: "Your preschooler is asking 'why' about everything — embrace their curiosity! They're developing friendships, understanding taking turns, and building complex pretend play scenarios.", self_care: "As your child becomes more independent, rediscover interests you set aside. Even small steps toward your own goals matter." },
  { min_weeks: 183, max_weeks: 208, body: "Pre-literacy and pre-math skills are developing. Your child can count objects, recognize some letters, and draw recognizable pictures. Reading together remains one of the most impactful activities.", self_care: "Parenting a preschooler requires a lot of patience and creativity. Give yourself credit for the hard work you do every day." },

  // ── 4-5 years (209-260 weeks) ──
  { min_weeks: 209, max_weeks: 234, body: "School readiness is developing — your child is learning to follow multi-step directions, cooperate with peers, and manage some frustrations independently. Social skills are as important as academic ones.", self_care: "The transition to school (or the approach of it) can bring up big feelings for parents too. It's okay to feel both excited and sad." },
  { min_weeks: 235, max_weeks: 260, body: "Your child is developing a strong sense of self, forming real friendships, and asking increasingly complex questions about the world. Keep nurturing their curiosity and confidence.", self_care: "You've made it through the early years. Look back at how far you've both come. The foundation you've built matters more than any single moment." },
];
