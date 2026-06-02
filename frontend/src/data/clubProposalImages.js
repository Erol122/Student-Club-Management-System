import art from '../assets/club-images/art.jpg';
import chess from '../assets/club-images/chess.jpg';
import debate from '../assets/club-images/debate.jpg';
import fitness from '../assets/club-images/fitness.jpg';
import game from '../assets/club-images/game.jpg';
import hiking from '../assets/club-images/hiking.jpg';
import movie from '../assets/club-images/movie.jpg';
import music from '../assets/club-images/music.jpg';
import photography from '../assets/club-images/photography.jpg';
import study from '../assets/club-images/study.jpg';
import theatre from '../assets/club-images/theatre.jpg';

export const clubProposalImages = [
  { key: 'chess', label: 'Chess', src: chess },
  { key: 'art', label: 'Art', src: art },
  { key: 'music', label: 'Music', src: music },
  { key: 'debate', label: 'Debate', src: debate },
  { key: 'photography', label: 'Photography', src: photography },
  { key: 'theatre', label: 'Theatre', src: theatre },
  { key: 'fitness', label: 'Fitness', src: fitness },
  { key: 'hiking', label: 'Hiking', src: hiking },
  { key: 'study', label: 'Study', src: study },
  { key: 'game', label: 'Gaming', src: game },
  { key: 'movie', label: 'Movies', src: movie },
];

export const clubProposalImageByKey = new Map(
  clubProposalImages.map((image) => [image.key, image])
);
