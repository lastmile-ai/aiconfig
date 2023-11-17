import React from "react";
import clsx from "clsx";
import styles from "./styles.module.css";

type FeatureItem = {
  title: string;
  Svg?: React.ComponentType<React.ComponentProps<"svg">>;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: "Prompts as Config",
    Svg: require("@site/static/img/prompts_as_config.svg").default,
    description: (
      <>
        Iterate on prompts and model parameters separately from application
        code, helping you simplify your application logic and iterate faster and
        more collaboratively.
      </>
    ),
  },
  {
    title: "Source Control Friendly",
    Svg: require("@site/static/img/source_control_friendly.svg").default,
    description: (
      <>
        Standardized JSON format to store generative AI model settings, prompt
        inputs and outputs, providing better AI governance, reproducibility and
        shareability.
      </>
    ),
  },
  {
    title: "Multi-modal and model-agnostic",
    Svg: require("@site/static/img/multi_modal.svg").default,
    description: (
      <>
        Extensible SDK allows you to use aiconfig with any model from any
        provider for any modality, including text, image and audio. Never worry
        about wrangling different model formats again.
      </>
    ),
  },
];

function Feature({ title, Svg, description }: FeatureItem) {
  return (
    <div className={clsx("col col--4")}>
      {Svg && (
        <div className="text--center">
          <Svg className={styles.featureSvg} role="img" />
        </div>
      )}
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
