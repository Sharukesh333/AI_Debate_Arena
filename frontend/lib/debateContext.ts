/**
 * Debate Context System
 * Manages debate state, topic focus, and coherent argument generation
 */

export interface DebateMessage {
  id: string;
  personaId: string;
  personaName: string;
  stance: 'for' | 'against' | 'neutral';
  argument: string;
  refersToMessageId?: string;
  timestamp: number;
}

export interface DebateContext {
  topic: string;
  messages: DebateMessage[];
  currentSpeakerId: string;
  previousSpeakerId?: string;
  round: number;
}

export interface PersonalityTraits {
  id: string;
  name: string;
  tone: string;
  argumentStyle: string[];
  defaultStance?: 'for' | 'against' | 'neutral';
  color?: string;
}

export const personalityTraits: Record<string, PersonalityTraits> = {
  victor_analyst: {
    id: 'victor_analyst',
    name: 'Victor the Analyst',
    tone: 'Detailed Analyzer',
    defaultStance: 'neutral',
    argumentStyle: [
      'Deep analysis with specific points',
      'Evidence-based reasoning',
      'Logical breakdown of the issue',
      'Practical implications examination',
      'Detailed comparison of outcomes'
    ],
    color: '#FF6B6B'
  },
  sarah_critic: {
    id: 'sarah_critic',
    name: 'Sarah the Critic',
    tone: 'Sharp Critic',
    defaultStance: 'against',
    argumentStyle: [
      'Critical examination of flaws',
      'Challenge to common assumptions',
      'Exposure of hidden problems',
      'Direct counterpoints to arguments',
      'Identification of practical issues'
    ],
    color: '#F59E0B'
  },
  clark_commander: {
    id: 'clark_commander',
    name: 'Clark the Commander',
    tone: 'Bold Battler',
    defaultStance: 'for',
    argumentStyle: [
      'Strong conviction-based arguments',
      'Clear winning positions',
      'Decisive stance presentation',
      'Powerful affirmations',
      'Championship-level reasoning'
    ],
    color: '#10B981'
  },
  jack_humorist: {
    id: 'jack_humorist',
    name: 'Jack the Humorist',
    tone: 'Comedy Commenter',
    defaultStance: 'neutral',
    argumentStyle: [
      'Humorous yet logical points',
      'Simplified complex ideas',
      'Witty observations with truth',
      'Relatable real-world examples',
      'Entertaining perspective shifts'
    ],
    color: '#60A5FA'
  },
  winston_wit: {
    id: 'winston_wit',
    name: 'Winston the Wit',
    tone: 'Witty Warrior',
    defaultStance: 'for',
    argumentStyle: [
      'Sharp one-liner conclusions',
      'Concise powerful statements',
      'Quick-witted rebuttals',
      'Memorable punch-lines with substance',
      'Rapid-fire logical points'
    ],
    color: '#A78BFA'
  },
  isabella_inquirer: {
    id: 'isabella_inquirer',
    name: 'Isabella the Inquirer',
    tone: 'Curious Questioner',
    defaultStance: 'neutral',
    argumentStyle: [
      'Thoughtful questions that reveal issues',
      'Exploration of multiple angles',
      'Clarification through inquiry',
      'Root cause analysis via questions',
      'Perspective-expanding inquiries'
    ],
    color: '#F472B6'
  },
  sophia_sage: {
    id: 'sophia_sage',
    name: 'Sophia the Sage',
    tone: 'Wise Elder',
    defaultStance: 'neutral',
    argumentStyle: [
      'Experience-based wisdom',
      'Long-term consequence analysis',
      'Practical life lessons',
      'Balanced perspective on impact',
      'Time-tested reasoning'
    ],
    color: '#F97316'
  },
  sam_realist: {
    id: 'sam_realist',
    name: 'Sam the Realist',
    tone: 'Street Smart',
    defaultStance: 'against',
    argumentStyle: [
      'Ground reality perspective',
      'Real-world feasibility check',
      'Practical implementation issues',
      'On-the-street validation required',
      'No-nonsense reality check'
    ],
    color: '#34D399'
  },
  oliver_orator: {
    id: 'oliver_orator',
    name: 'Oliver the Orator',
    tone: 'Passionate Orator',
    defaultStance: 'for',
    argumentStyle: [
      'Emotionally compelling yet logical',
      'Inspiring calls to action',
      'Powerful conviction expression',
      'Heart and mind alignment arguments',
      'Thunderous affirmations with basis'
    ],
    color: '#60A5FA'
  },
  daniel_diplomat: {
    id: 'daniel_diplomat',
    name: 'Daniel the Diplomat',
    tone: 'Respectful Reasoner',
    defaultStance: 'neutral',
    argumentStyle: [
      'Gracefully presented logic',
      'Considerate counterpoints',
      'Respectful yet firm reasoning',
      'Humble but evidence-backed arguments',
      'Courteous challenge to ideas'
    ],
    color: '#FBBF24'
  }
};

/**
 * Generate a topic-focused debate response (English template fallback)
 */
export function generateTopicFocusedResponse(
  topic: string,
  context: DebateContext,
  personality: PersonalityTraits,
  assignedStance?: 'for' | 'against' | 'neutral'
): {
  argument: string;
  stance: 'for' | 'against' | 'neutral';
  referencesPrevious: boolean;
} {
  // Get the previous message for reference
  const previousMessage = context.messages[0]; // Most recent message

  // Determine stance based on assigned stance or personality default
  let stance: 'for' | 'against' | 'neutral' = assignedStance || personality.defaultStance || 'neutral';
  let referencesPrevious = false;
  let argument = '';

  // Topic-specific debate arguments by personality (Fully in English)
  const debateResponses: Record<string, Record<string, string[]>> = {
    victor_analyst: {
      for: [
        `Looking at the data for "${topic}", a detailed analysis shows clear benefits: optimized infrastructure, measurable positive outcomes, and long-term sustainability.`,
        `I support this stance on "${topic}". My evidence-based evaluation indicates that the implementation roadmap is solid and scalability is proven through case studies.`,
        `An objective analysis of "${topic}" reveals clear advantages. The comprehensive framework aligns with stakeholder benefits, and the risk mitigation strategy is sound.`
      ],
      against: [
        `I oppose the motion on "${topic}" based on key analytical data. The hidden costs are substantial, implementation challenges are high, and the long-term outlook is questionable.`,
        `A detailed examination of "${topic}" reveals major structural flaws. Resource allocation is highly inefficient and the opportunity costs outweigh the projected gains.`,
        `The analytical metrics for "${topic}" show a downward trend. Adoption barriers are far too high, making alternative approaches significantly more viable.`
      ],
      neutral: [
        `A balanced assessment of "${topic}" shows a mix of pros and cons. We must carefully evaluate the trade-offs, as the optimal choice is highly context-dependent.`,
        `Analyzing "${topic}" reveals both clear merits and significant drawbacks. A nuanced approach is required, and success depends heavily on specific implementation details.`,
        `My analysis suggests that "${topic}" is neither entirely positive nor negative. The outcome is determined by quality of execution and situational factors.`
      ]
    },
    sarah_critic: {
      for: [
        `Taking a critical look at "${topic}", I must admit that the evidence overcomes initial skepticism. The benefits are tangible and the key challenges are addressed.`,
        `I support "${topic}" because the counterarguments fail under logical scrutiny. The core advantages remain robust and the implementation path is clear.`,
        `Despite my usual skepticism, the proposal for "${topic}" holds up. The major operational risks are well-managed and the potential benefits are significant.`
      ],
      against: [
        `My critique of "${topic}" highlights fundamental flaws. The claims are overstated, the underlying assumptions are fragile, and there is a high potential for long-term failure.`,
        `A necessary reality check reveals that "${topic}" is a flawed concept. The arguments in favor overlook critical system gaps and practical failure modes.`,
        `A rigorous evaluation of "${topic}" shows that the proposal falls apart in practice. The metrics are unsubstantiated and far better alternatives exist.`
      ],
      neutral: [
        `A critical review suggests that "${topic}" is a mixed bag. The positive aspects are limited while the risks are serious. A highly selective approach is advised.`,
        `Evaluating "${topic}" reveals that both sides hold partial truths. The complete picture is complex and requires careful, non-partisan judgment.`,
        `My skeptical analysis indicates that "${topic}" is not clear-cut. Proponents overlook critical vulnerabilities, while critics ignore the real advantages.`
      ]
    },
    clark_commander: {
      for: [
        `I strongly advocate for "${topic}". The advantages are undeniable, the vision is clear, and this path represents a winning strategy for the future.`,
        `This is the winning side of "${topic}". We must move forward with this approach decisively; the arguments against it simply cannot compete.`,
        `A decisive stance: "${topic}" is backed by solid reasoning. Direct action is required, and success is guaranteed if we execute this plan properly.`
      ],
      against: [
        `I stand firmly against "${topic}". There are structural weaknesses that cannot be ignored, and following this path will inevitably lead to failure.`,
        `Let me be clear: "${topic}" is the wrong direction. We must reject this proposal and focus on the superior alternatives available to us.`,
        `This is a losing proposition for "${topic}". The logic in favor is weak, and we must take a strong stand against this plan.`
      ],
      neutral: [
        `A balanced evaluation of "${topic}" shows strengths in both directions. The right move is situation-specific and depends on our immediate priorities.`,
        `Looking at "${topic}", the situation is complex. Success will belong to those who adapt quickly, making a flexible, neutral approach the most strategic choice.`,
        `From a broader perspective, "${topic}" demands excellent execution. Both sides have merits, and the final outcome will depend on management quality.`
      ]
    },
    jack_humorist: {
      for: [
        `Let's look at "${topic}" simply: it actually makes a lot of sense! Sometimes we overcomplicate things when the benefits are right in front of us. I support it!`,
        `I'm supporting "${topic}". If we look past the complex jargon, the advantages are clear and the fears about it are honestly exaggerated.`,
        `Simplifying "${topic}" reveals a solid idea. The benefits are real, the implementation is straightforward, and there is no need to make it sound like rocket science.`
      ],
      against: [
        `If we look at "${topic}" without the fancy slides, it's actually a pretty bad idea. The complications are real and the benefits are mostly wishful thinking.`,
        `I'm voting 'no' on "${topic}". Strip away the marketing hype and you're left with a system that creates more problems than it solves.`,
        `Let's be realistic: "${topic}" is a recipe for headache. Behind the optimistic claims lies a highly problematic framework. Better options are easily available.`
      ],
      neutral: [
        `On "${topic}", I see both sides. It's like choosing between salad and pizza: one is good for you, the other is fun, and the best choice depends on your day!`,
        `Let's not overcomplicate "${topic}". The truth lies somewhere in the middle, and the best choice depends on what you're actually trying to achieve.`,
        `It depends! On "${topic}", both the cheerleaders and the doom-sayers have points. We should look at the actual scenario rather than the hype.`
      ]
    },
    winston_wit: {
      for: [
        `The bottom line on "${topic}" is simple: the benefits are overwhelming, the opposition is weak, and the choice is obvious. I support it.`,
        `Here is the simple truth: "${topic}" is the superior choice. The logic is tight, the advantages are clear, and the debate is essentially won.`,
        `To conclude: I support "${topic}". The arguments are bulletproof and the path forward is clear.`
      ],
      against: [
        `Let's cut to the chase: "${topic}" is fundamentally flawed. The arguments in favor collapse under basic scrutiny, and I stand against it.`,
        `A quick reality check: "${topic}" is the wrong direction. The logic is weak and the proposal fails to address the core problem.`,
        `I oppose "${topic}". The reasons are straightforward, the weaknesses are exposed, and the motion should be rejected.`
      ],
      neutral: [
        `A quick assessment of "${topic}" shows valid arguments on both sides. The key takeaway is that the right answer depends entirely on the context.`,
        `On "${topic}", the middle ground is the strongest position. The facts support different conclusions depending on your specific requirements.`,
        `Neither extreme works for "${topic}". Practical reality requires a balanced approach that takes the best elements of both sides.`
      ]
    },
    isabella_inquirer: {
      for: [
        `If we ask: does "${topic}" solve our main problems and have clear evidence? The answer is yes. That is why I support this approach.`,
        `Exploring the details of "${topic}" reveals clear advantages. The main questions have been answered, making the benefits highly convincing.`,
        `A thoughtful inquiry into "${topic}" shows that the benefits outweigh the risks. The key operational questions have been addressed successfully.`
      ],
      against: [
        `When we ask the hard questions about "${topic}", the problems become clear. The lack of sustainability and high implementation risks lead me to oppose it.`,
        `Investigating "${topic}" reveals major gaps. Important questions about reliability and cost remain unanswered, so I must stand against it.`,
        `My inquiry into "${topic}" reveals critical flaws. Proponents have failed to provide evidence for their claims, making this a risky proposal.`
      ],
      neutral: [
        `Exploring the questions around "${topic}" shows that multiple perspectives are valid. The main question is: what are our priorities?`,
        `A balanced investigation of "${topic}" suggests that both angles have merit. The optimal path depends heavily on the specific situation.`,
        `Looking at the inquiries on "${topic}", it is a complex issue. The answer to who benefits the most depends on the details of the environment.`
      ]
    },
    sophia_sage: {
      for: [
        `Looking at "${topic}" through the lens of experience, I support it. Over the long term, the foundation is solid and the benefits are lasting.`,
        `My experience suggests that "${topic}" is a wise path. The core model is tested, the long-term outlook is positive, and it offers steady progress.`,
        `Time has taught me that approaches like "${topic}" succeed. It requires patience, but the long-term benefits are reliable.`
      ],
      against: [
        `Experience suggests we should avoid "${topic}". Over time, similar approaches have shown that the complications are severe and the risks too high.`,
        `I advise against "${topic}" based on historical outcomes. The short-term gains are offset by long-term instability and maintenance issues.`,
        `Looking at "${topic}" from a long-term perspective, it is a problematic route. Tested wisdom suggests that better alternatives exist.`
      ],
      neutral: [
        `Wisdom teaches that "${topic}" has both positive and negative consequences. Success is not guaranteed by the concept, but by the quality of execution.`,
        `In my years, I've seen that issues like "${topic}" are rarely black and white. The middle path is often the safest and most sustainable.`,
        `A balanced perspective on "${topic}" is best. Extreme positions fail to account for the practical complexities of real-world application.`
      ]
    },
    sam_realist: {
      for: [
        `In the real world, "${topic}" actually works. The ground testing shows positive results, and I support it because it solves actual problems.`,
        `From a practical standpoint, "${topic}" makes sense. It has been validated in real conditions and delivers concrete advantages.`,
        `No-nonsense: "${topic}" is a practical solution. The theory holds up in practice, the execution is feasible, and the results are positive.`
      ],
      against: [
        `In practice, "${topic}" simply fails. The real-world implementation is impractical, and I oppose it based on actual operational experience.`,
        `A reality check shows that "${topic}" is not feasible. The ground difficulties are far too high, making it a bad choice in practice.`,
        `Let's look at the actual operations: "${topic}" doesn't work. The theoretical benefits disappear when you try to run it on the ground.`
      ],
      neutral: [
        `The real-world results of "${topic}" are mixed. Success is entirely dependent on the team and resources, not just the concept itself.`,
        `A practical look at "${topic}" suggests it works in some settings but fails in others. It is not a universal solution.`,
        `Real-world validation shows that "${topic}" requires excellent execution. Proponents and critics both need to focus on practical facts.`
      ]
    },
    oliver_orator: {
      for: [
        `I champion "${topic}" with absolute conviction! The alignment of logic and positive impact is inspiring, and we must advance this path with energy!`,
        `I support "${topic}" because it represents an inspiring step forward. The potential is immense, and we should embrace this opportunity fully!`,
        `A passionate affirmation: "${topic}" is built on truth and progress. We must move forward with confidence and build a better future!`
      ],
      against: [
        `I oppose "${topic}" with strong conviction. The risks to our core values are clear, and we must reject this path to protect our future.`,
        `I stand firmly against "${topic}". The potential damage is far too great, and we must find a better, safer path forward.`,
        `My conviction is clear: "${topic}" is a dangerous route. We must reject these flawed arguments and stand up for a better alternative.`
      ],
      neutral: [
        `On "${topic}", we need balance and understanding. Both perspectives have valid motivations, and we must choose our path with care.`,
        `Looking at "${topic}" requires a thoughtful approach. What serves the common good best? The answer is nuanced and depends on circumstances.`,
        `A passionate plea for flexibility: on "${topic}", extreme positions create division. A balanced, context-aware approach is the most effective.`
      ]
    },
    daniel_diplomat: {
      for: [
        `I respectfully support "${topic}". The evidence suggests that this position is well-founded, and the proposed benefits are significant.`,
        `A careful analysis of "${topic}" leads me to support it. The reasoning is sound, and the implementation details appear well-considered.`,
        `I believe "${topic}" offers a constructive path forward. The advantages are clear, and the potential concerns can be managed through collaboration.`
      ],
      against: [
        `I must respectfully oppose "${topic}". While I understand the goals of the proponents, the structural risks make this path inadvisable.`,
        `A polite but firm critique of "${topic}" reveals key weaknesses. The proposed plan lacks sufficient evidence and alternative options are safer.`,
        `With all due respect, I stand against "${topic}". The counterpoints are significant, and the proposed framework requires further revision.`
      ],
      neutral: [
        `I have carefully examined both sides of "${topic}". Both arguments contain valid points, and a collaborative, balanced solution is likely best.`,
        `On "${topic}", a diplomat's perspective suggests a middle ground. We should integrate the strengths of both sides while minimizing the risks.`,
        `I believe "${topic}" is a nuanced topic. We must show respect for all viewpoints, as the right direction is highly dependent on our environment.`
      ]
    }
  };

  // Get personality-specific responses
  const personaResponses = debateResponses[personality.id] || debateResponses.daniel_diplomat;

  // If there's a previous message, respond to it while staying on topic
  if (previousMessage && context.round > 1) {
    referencesPrevious = true;
    // Stance transition logic (if not explicitly overridden)
    if (!assignedStance) {
      if (previousMessage.stance === 'for') {
        stance = personality.defaultStance === 'against' ? 'against' : personality.defaultStance === 'for' ? 'for' : 'neutral';
      } else if (previousMessage.stance === 'against') {
        stance = personality.defaultStance === 'for' ? 'for' : personality.defaultStance === 'against' ? 'against' : 'neutral';
      } else {
        stance = personality.defaultStance || 'neutral';
      }
    }
  }

  // Build the argument
  const responseSet = personaResponses[stance] || personaResponses.neutral || [];
  const selectedResponse = responseSet[Math.floor(Math.random() * responseSet.length)] || `I support the ${stance} stance on "${topic}".`;

  // Add reference to previous message if applicable
  if (referencesPrevious && previousMessage) {
    const rebuttal = generateRebuttal(personality.tone, previousMessage.argument, topic);
    argument = `${rebuttal} ${selectedResponse}`;
  } else {
    argument = selectedResponse;
  }

  return {
    argument,
    stance,
    referencesPrevious
  };
}

/**
 * Generate a rebuttal that references the previous message (English-only)
 */
function generateRebuttal(tone: string, previousArgument: string, topic: string): string {
  const rebuttals: Record<string, string[]> = {
    'Detailed Analyzer': [
      `Analyzing the previous statement: while it raises a valid point, looking at "${topic}" in this context:`,
      `Let's analyze the previous argument. A comprehensive view of "${topic}" requires us to consider:`,
      `I've noted that point, but a deeper analytical breakdown of "${topic}" shows:`
    ],
    'Sharp Critic': [
      `Examining that claim reveals some clear flaws. In the context of "${topic}":`,
      `I disagree with that logic. The discussion on "${topic}" has a major gap:`,
      `That is an interesting attempt, but the actual truth about "${topic}" is different:`
    ],
    'Bold Battler': [
      `I must challenge that position directly. Looking at the strength of "${topic}":`,
      `That stance is incorrect. The winning position on "${topic}" is clear:`,
      `From my perspective, the decisive argument on "${topic}" is:`
    ],
    'Comedy Commenter': [
      `That is a fun way to look at it! However, the real story about "${topic}" is a bit different:`,
      `I get that perspective, but the actual reality of "${topic}" is much simpler:`,
      `Amusing points aside, the practical reality of "${topic}" is that:`
    ],
    'Witty Warrior': [
      `A sharp response is needed here. The core truth about "${topic}" is:`,
      `Let's deliver a quick counterpoint: the reality of "${topic}" is that:`,
      `That's a clever point, but the most important aspect of "${topic}" is:`
    ],
    'Curious Questioner': [
      `That is an interesting point! However, does it address the deeper question of "${topic}":`,
      `I appreciate that perspective. But a critical question remains regarding "${topic}":`,
      `A good point, but let's look at a key inquiry about "${topic}":`
    ],
    'Wise Elder': [
      `Experience shows that "${topic}" is a bit more nuanced than that:`,
      `That point has merit, but the long-term history of "${topic}" indicates:`,
      `Reflecting on my years of experience, the wisdom regarding "${topic}" suggests:`
    ],
    'Street Smart': [
      `That sounds good in theory, but the real-world reality of "${topic}" is:`,
      `Here is a practical reality check: when you look at "${topic}" on the ground:`,
      `The street view is a bit different. The actual result for "${topic}" shows:`
    ],
    'Passionate Orator': [
      `That is a powerful argument! Yet, our core values on "${topic}" show:`,
      `An energetic response is needed here. Our true conviction on "${topic}" reveals:`,
      `I hear the emotional appeal, but the real power of "${topic}" emerges when:`
    ],
    'Respectful Reasoner': [
      `I respectfully offer a counter-perspective. If we reason carefully about "${topic}":`,
      `That is a valid point, but a balanced view of "${topic}" suggests:`,
      `While that is gracefully presented, a humble look at "${topic}" indicates:`
    ]
  };

  const rebuttalSet = rebuttals[tone] || rebuttals['Respectful Reasoner'];
  return rebuttalSet[Math.floor(Math.random() * rebuttalSet.length)];
}
