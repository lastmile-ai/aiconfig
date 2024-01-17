type Props = {
  children: React.ReactNode;
  condition: boolean;
  wrapper: (children: React.ReactNode) => React.ReactElement | null;
};

export default function ConditionalWrapper({
  children,
  condition,
  wrapper,
}: Props): React.ReactElement | null {
  if (condition) {
    return wrapper(children);
  } else {
    return <>{children}</>;
  }
}
