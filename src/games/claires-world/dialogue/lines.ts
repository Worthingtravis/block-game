import type { DialogueTrigger } from '../game/types'

export const CLAIRE_LINES: Record<DialogueTrigger, string[]> = {
  start: [
    "Welcome to my world. My rules.",
    "Oh good, you're here. Let's play.",
    "I've been waiting. Don't disappoint me.",
    "New challenger. Interesting.",
    "I designed this board myself. You're welcome.",
    "Ready? No? Too bad. We're starting.",
    "Don't worry, I'll go easy on you. Ha. No I won't.",
    "Let's see what you've got.",
  ],

  good_move: [
    "Claire approves.",
    "Not bad... not bad at all.",
    "Okay, that was actually sick.",
    "I'll allow it.",
    "Hm. Impressive. Don't get used to it.",
    "Fine. That was good. I said it.",
    "Okay okay okay. Keep going.",
    "Did you just... okay yeah that worked.",
  ],

  bad_move: [
    "...interesting choice.",
    "That was certainly a move.",
    "Bold strategy. Respect... actually no.",
    "I've seen better from NPCs.",
    "Did you mean to do that? Be honest.",
    "Mmm. Yeah. Okay.",
    "Surely you had a plan there.",
    "I'm not mad. Just disappointed.",
  ],

  mode_switch: [
    "I'm bored. New rules.",
    "Plot twist.",
    "Switching it up.",
    "You were getting comfortable. Can't have that.",
    "Time for something more interesting.",
    "New mode unlocked: chaos.",
    "I got bored watching you. Mode change.",
    "Different vibe incoming.",
  ],

  idle: [
    "...hello?",
    "I'm waiting.",
    "The board isn't going to play itself.",
    "Still here. Not thrilled about it.",
    "Did you fall asleep? On MY board?",
    "Some of us don't have all day.",
    "Tap something. Anything. Please.",
    "I can wait longer than you. Try me.",
  ],

  streak: [
    "WAIT. Are you cracked??",
    "I need to make this harder.",
    "You're making me look bad.",
    "Okay this is getting out of hand.",
    "Not the combo I designed this for.",
    "That should not have worked. And yet.",
    "Alright I respect it. But I hate it.",
    "You are suspiciously good at this.",
  ],

  game_over: [
    "My board wins again.",
    "GG. Wanna try again?",
    "That was fun... for me.",
    "And that's game. My game.",
    "Could've gone better. For you.",
    "Don't feel bad. Most people lose here.",
    "The board sends its regards.",
    "Next time, maybe.",
  ],

  zen: [
    "No tricks. Promise. Mostly.",
    "Just vibes. For now.",
    "I'll let you breathe. For a second.",
    "This is the calm before me.",
    "Enjoy the peace. It's temporary.",
    "Even I take breaks. This is yours.",
    "No chaos. Just colors. You're welcome.",
    "Breathe. You'll need it.",
  ],
}
