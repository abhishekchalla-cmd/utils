type BasicDecisionMakerArgs<
  P extends {
    [paramName: string]: number;
  }
> = {
  parameterPriorities: P;
  objects: Array<{
    name: string;
    configuration: {
      [parameterName in keyof P]: number;
    };
  }>;
};

const basicDecisionMaker = async <
  P extends {
    [paramName: string]: number;
  }
>(
  args: BasicDecisionMakerArgs<P>
) => {
  let highScore = -Infinity,
    object = null;

  for (const obj of args.objects) {
    let score = 0;
    for (const param in obj.configuration) {
      score += obj.configuration[param] * args.parameterPriorities[param];
    }
    if (score > highScore) {
      highScore = score;
      object = obj;
    }
  }

  return object;
};

/*



EXECUTE



*/

if (require.main.filename === __filename)
  basicDecisionMaker({
    parameterPriorities: {
      "Interpretability Priority": 1,
      "Time cheapness Priority": 2,
      "Compute Cheapness Priority": 1,
      "Accuracy Priority": 2,
      "Ability handle large datasets Priority": 2,
      "Overfitting tolerance Priority": 1,
    },
    objects: [
      {
        name: "Logistic Regression",
        configuration: {
          "Interpretability Priority": 2,
          "Time cheapness Priority": 2,
          "Compute Cheapness Priority": 2,
          "Accuracy Priority": 0,
          "Ability handle large datasets Priority": 0,
          "Overfitting tolerance Priority": 0,
        },
      },
      {
        name: "Random Forest",
        configuration: {
          "Interpretability Priority": 0,
          "Time cheapness Priority": 0,
          "Compute Cheapness Priority": 1,
          "Accuracy Priority": 2,
          "Ability handle large datasets Priority": 2,
          "Overfitting tolerance Priority": 2,
        },
      },
      {
        name: "Gradient boosting machine",
        configuration: {
          "Interpretability Priority": 0,
          "Time cheapness Priority": 0,
          "Compute Cheapness Priority": 0,
          "Accuracy Priority": 2,
          "Ability handle large datasets Priority": 1,
          "Overfitting tolerance Priority": 1,
        },
      },
    ],
  }).then((res) => console.log(res.name));
