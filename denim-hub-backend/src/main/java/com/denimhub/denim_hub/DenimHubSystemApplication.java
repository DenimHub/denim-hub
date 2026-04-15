package com.denimhub.denim_hub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DenimHubSystemApplication {

	public static void main(String[] args) {
		SpringApplication.run(DenimHubSystemApplication.class, args);

        System.out.println("Hello From DenimHubSystemApplication");
	}

}
