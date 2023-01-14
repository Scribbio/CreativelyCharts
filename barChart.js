class CreativelyBarChart {
  constructor(title, description, source, responses, dataFile) {
    this.id = Math.random().toString(16).slice(2);
    this.title = title;
    this.description = description;
    this.dataFile = dataFile;
    this.data = null;
    this.source = source;
    this.responses = responses;
    // H / W of graph
    // set the dimensions and margins of the graph
    (this.margin = { top: 20, right: 30, bottom: 40, left: 110 }),
      (this.width = 750 - this.margin.left - this.margin.right),
      (this.height = 550 - this.margin.top - this.margin.bottom);

    // graph properties
    this.y = null;
    this.yAxis = null;
    this.svg = null;
    this.xAxis;

    this.state = "";
  }

  render = () => {
    return `<h3 class="mb-0 mx-2">${this.title}</h3>
      <p>${this.description}</p>
      <small>${this.responses} responses</small>
      <div id="stacked-bar-${this.id}"></div>
      <div class="mt-3 text-right col-lg-11">
        <small
          >Source:
          <a
            href="https://survey.stackoverflow.co/2022/"
            target="blank"
            >${this.source}</a
          ></small
        >
      </div>
  
      <button
        id="percentage${this.id}"
        class="btn btn-secondary my-1 col-4 col-md-3 col-lg-2"
      >
        Percentage
      </button>
      <button
        id="responses${this.id}"
        class="btn btn-secondary my-1 col-4 col-md-3 col-lg-2"
      >
        Responses
      </button>`;
  };

  getData = async (dt) => {
    const data = await d3.csv(dt);

    return data;
  };

  createSVG = () => {
    // set the dimensions and margins of the graph
    // const margin = { top: 20, right: 30, bottom: 40, left: 140 };

    // not sure why I can't select by id below but oh well!
    const graphHook = document.getElementById(`stacked-bar-${this.id}`);

    // append the svg object to the body of the page
    this.svg = d3
      .select(graphHook)
      // .select(`stacked-bar-${that.id}`) // this should work in D3!
      .append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      // .attr("height", height + margin.top + margin.bottom)
      // .attr("width", this.width)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr(
        "transform",
        "translate(" + this.margin.left + "," + this.margin.top + ")"
      );

    return svg;
  };

  createXScaling = (data, domain) => {
    // x axis
    // let x = d3.scaleLinear().domain([0, data[0].Value]).range([0, width]);
    let x = d3
      .scaleLinear()
      .domain([0, domain ? domain : data[0].Value])
      .range([0, this.width]);

    // svg.selectAll("g.xaxis").transition().duration(1000).call(d3.axisLeft(y));
    return x;
  };

  createYAxis = (data) => {
    // Y axis
    const y = d3
      .scaleBand()
      .range([0, this.height])
      .domain(
        data.map(function (d) {
          return Object.values(d)[0];
        })
      )
      .padding(0.1);

    return y;
  };

  splitTextMultipleLines = () => {
    // split ticks onto multiple lines, is there an easier way of doing this? Woah.
    this.svg
      .selectAll(".tick text") // select all the x tick texts
      .call((t) => {
        t.each(function (d) {
          const splitWords = (text, numWords) => {
            const words = text.split(" ");
            let part1 = "",
              part2 = "";
            words.forEach((word, idx) => {
              if (idx < numWords) {
                part1 += " " + word;
              } else {
                part2 += " " + word;
              }
            });
            return [part1.trim(), part2.trim()];
          };

          const self = d3.select(this);

          const [firstHalf, secondHalf] = splitWords(self.text(), 3);
          self.text(""); // clear it out
          self
            .append("tspan") // insert two tspans
            .attr("x", -10)
            .attr("dy", ".15em")
            .text(firstHalf)
            .style("text-anchor", "center");
          self
            .append("tspan")
            .attr("x", -10)
            .attr("dy", ".65em")
            .text(secondHalf)
            .style("text-anchor", "center");
        });
      });
  };

  init = async (contentHook) => {
    // a function that splits words by number of words

    // add stringified HTML to the provided HTML element
    contentHook.innerHTML = this.render();

    this.data = await this.getData(this.dataFile);

    // Parse the Data
    // const absoluteValues = () => {

    d3.select(`#percentage${this.id}`).on("click", () => {
      // responsesState = true;
      this.updatePercentage();
    });

    d3.select(`#responses${this.id}`).on("click", () => {
      // responsesState = true;
      this.updateResponse();
    });

    this.updateResponse();
  };

  updatePercentage = (svg) => {
    if (this.state !== "percentage") {
      console.log("data", this.data);

      let data = this.data;

      const total = d3.sum(data, (d) => d.Value);

      // Update X axis with 100 (%)
      let x = this.createXScaling(data, 100);

      this.xAxis
        .transition()
        .duration(1000)
        .call(
          d3.axisBottom(x).tickFormat((d) => {
            if (d !== 0) {
              console.log("value", d);
              return d + "%";
            } else {
              return 0;
            }
          })
        );

      console.log("data", total);

      //       // select bars
      var u = this.svg.selectAll("rect").data(data);

      // Update chart
      this.svg
        .selectAll("rect")
        .data(data)
        .merge(u) // get the already existing elements as well
        .transition() // and apply changes to all of them
        .duration(2000)
        .attr("x", x(0))
        // .attr("y", (d) => {
        //   // get value of first column
        //   return this.y(Object.values(d)[0]);
        // })
        .attr("width", (d) => {
          console.log("here", Math.floor((d.Value / total) * 100));
          return x(Math.floor((d.Value / total) * 100));
        })
        .attr("height", this.y.bandwidth());
      this.state = "percentage";
    }
  };

  updateResponse = async () => {
    if (this.state !== "response") {
      this.data.sort(function (a, b) {
        return b.Value - a.Value;
      });

      if (!this.svg) {
        this.createSVG();
      }
      // X //////////////////
      let x = this.createXScaling(this.data);

      if (!this.xAxis) {
        this.xAxis = this.svg
          .append("g")
          .attr("transform", `translate(0, ${this.height})`)
          .style("font", "14px times")
          .call(d3.axisBottom(x));
      }

      this.xAxis.transition().duration(1000).call(d3.axisBottom(x));

      // Y //////////////////
      // if y doesn't exist
      if (!this.yAxis) {
        this.y = this.createYAxis(this.data);
        this.yAxis = this.svg
          .append("g")
          .style("font", "14px times")
          .call(d3.axisLeft(this.y));
        // make ticks 'slanted'
        this.svg
          .selectAll("text")
          .attr("transform", "translate(-10,0)rotate(-25)")
          .style("text-anchor", "end");
        this.splitTextMultipleLines();
      }
      ///////////

      // build out bars ////////////
      // select bars
      let bars = this.svg
        .selectAll("rect")
        .data(this.data)
        .enter()
        .append("rect");

      //Bars
      this.svg
        .selectAll("rect")
        .data(this.data)
        .merge(bars) // get the already existing elements as well
        .transition() // and apply changes to all of them
        .duration(2000)
        .attr("x", x(0))
        .attr("y", (d) => {
          // value of first column
          return this.y(Object.values(d)[0]);
        })
        .attr("width", (d) => {
          return x(d.Value);
        })
        .attr("height", this.y.bandwidth())
        .attr("fill", "#69b3a2");
      this.state = "response";
    }
  };
}
