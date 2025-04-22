export const BustEmoji = () => {
  return (
    <span role="img" aria-label="crack">
      🍳
    </span>
  );
};

export const NoBustEmoji = () => {
  return (
    <span role="img" aria-label="not crack">
      👍
    </span>
  );
};

export const BustProb = (props: {
  prob: number;
  prob2text?: (prob: number) => string;
  bust?: boolean;
}) => {
  const { prob, prob2text } = props;
  let { bust } = props;

  if (bust == null) {
    bust = true;
  }

  const prettyProb = (prob * 100).toFixed(1);

  let title;
  if (prob2text == null) {
    const not = bust ? "" : "not ";
    title = `The probably of ${not}cracking is ${prettyProb}%`;
  } else {
    title = prob2text(prob);
  }
  return (
    <span title={title}>
      {bust ? <BustEmoji /> : <NoBustEmoji />}
      &nbsp;=&nbsp;
      <span title={`${prob}`}>
        <strong>{prettyProb}</strong>%
      </span>
    </span>
  );
};
