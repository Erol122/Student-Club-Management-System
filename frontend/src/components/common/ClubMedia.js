import { clubProposalImageByKey } from '../../data/clubProposalImages';

export function ClubThumbnail({ imageKey, name, className = 'club-thumbnail' }) {
  const image = clubProposalImageByKey.get(imageKey);
  if (!image) return null;

  return <img className={className} src={image.src} alt="" title={name} loading="lazy" />;
}
