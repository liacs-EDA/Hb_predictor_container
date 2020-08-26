# Create the application image using the following command:
# docker build -f Dockerfile -t toivoja/hb-predictor .

FROM toivoja/r-base-tidyverse:latest

#RUN apt-get update -qq && apt-get -y --no-install-recommends install \
#r-cran-bh

## create directories
RUN mkdir -p /src
RUN mkdir -p /src/stan
RUN mkdir -p /output
RUN mkdir -p /static
RUN mkdir -p /data/rdata /data/rdump /data/stan_fits /data/raw_results

## copy files
COPY /src/stan/container.stan /src/stan/container.stan
COPY /src/stan/container_heckman_consts.stan /src/stan/container_heckman_consts.stan
COPY /src/stan/container_heckman.stan /src/stan/container_heckman.stan
COPY /src/stan/container_consts.stan /src/stan/container_consts.stan
COPY /static/style.css /static/style.css
COPY /static/script.js /static/script.js
COPY /static/bootstrap.min.css /static/bootstrap.min.css
COPY /static/bloodservice_logo.png /static/bloodservice_logo.png
COPY /static/FundedbyEBA.jpg /static/FundedbyEBA.jpg

COPY /src/docker-server-plumber.R /src/docker-server-plumber.R
COPY /src/docker-apps-plumber.R /src/docker-apps-plumber.R
COPY /src/ppc.R /src/ppc.R
COPY /src/new_preprocess.R /src/new_preprocess.R
COPY /src/helper_functions.R /src/helper_functions.R
COPY /src/validate_stan_fit.R /src/validate_stan_fit.R
COPY /src/jarkko_create_datasets.R /src/jarkko_create_datasets.R
COPY /src/hb-predictor.sh /src/hb-predictor.sh
COPY /src/hb-predictor-helper.R /src/hb-predictor-helper.R
COPY /src/jarkko_subset_analyses.Rmd /src/jarkko_subset_analyses.Rmd
COPY /src/template.Rmd /src/template.Rmd


## run the script
CMD Rscript /src/docker-server-plumber.R
